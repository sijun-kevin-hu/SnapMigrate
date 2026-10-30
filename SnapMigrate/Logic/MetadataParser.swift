import Foundation

actor MetadataParser {
    
    func parse(directory: URL) async throws -> [MemoryAsset] {
        var assets: [MemoryAsset] = []
        
        // 1. Locate memories_history.json
        // Snapchat exports can vary. Usually it's in a 'json' folder or root.
        let fileManager = FileManager.default
        let jsonURL = directory.appendingPathComponent("json/memories_history.json")
        let rootJsonURL = directory.appendingPathComponent("memories_history.json")
        
        let finalJsonURL = fileManager.fileExists(atPath: jsonURL.path) ? jsonURL : rootJsonURL
        
        guard fileManager.fileExists(atPath: finalJsonURL.path) else {
            // Fallback: Just scan all media files if JSON is missing, use file dates
        return try await Task.detached(priority: .userInitiated) {
            return try MetadataParser.scanFilesOnly(directory: directory)
        }.value
    }
        
        // 2. Parse JSON
        let data = try Data(contentsOf: finalJsonURL)
        let decoder = JSONDecoder()
        
        // Handle custom date format: "2020-01-20 22:34:11 UTC"
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss zzz"
        decoder.dateDecodingStrategy = .formatted(formatter)
        
        // Attempt to decode. If strict decoding fails, we might need a looser approach.
        // We'll decode a simpler structure just to get the list vs matching files.
        struct SimpleEntry: Codable {
            let Date: String
            let MediaType: String
            let DownloadLink: String?
            let Filename: String?
        }
        
        struct SimpleHistory: Codable {
            let SavedMedia: [SimpleEntry]
            
            enum CodingKeys: String, CodingKey {
                case SavedMedia = "Saved Media"
            }
        }
        
        _ = try? decoder.decode(SimpleHistory.self, from: data)
        
        // 3. Scan for actual files
        // Files are usually in 'memories' folder.
        let memoriesDir = directory.appendingPathComponent("memories")
        
        // Fix for Swift 6: Move file enumeration to a detached task/static helper to avoid makeIterator availability issues
        let allFiles = try await Task.detached(priority: .userInitiated) {
            return MetadataParser.listFiles(at: memoriesDir)
        }.value
        
        // 4. Match
        for file in allFiles {
            if file.pathExtension.lowercased() == "json" { continue }
            
            let filename = file.lastPathComponent
            var date: Date = Date()
            
            if let dateFromFilename = MetadataParser.parseDateFromFilename(filename) {
                date = dateFromFilename
            }
            
            let mediaType: MemoryAsset.MediaType = 
                (file.pathExtension.lowercased() == "mp4" || file.pathExtension.lowercased() == "mov") 
                ? .video : .image
            
            assets.append(MemoryAsset(
                fileURL: file,
                creationDate: date,
                location: nil, // Skipping location for MVP simplicity
                mediaType: mediaType
            ))
        }
        
        return assets.sorted { $0.creationDate < $1.creationDate }
    }
    
    private static func listFiles(at directory: URL) -> [URL] {
        let fileManager = FileManager.default
        if let enumerator = fileManager.enumerator(at: directory, includingPropertiesForKeys: nil) {
            return enumerator.compactMap { $0 as? URL }
        }
        return []
    
    private static func scanFilesOnly(directory: URL) throws -> [MemoryAsset] {
        // Implementation for when JSON is missing
        let fileManager = FileManager.default
        var assets: [MemoryAsset] = []
        
        if let enumerator = fileManager.enumerator(at: directory, includingPropertiesForKeys: [.creationDateKey]) {
            for case let file as URL in enumerator {
                let ext = file.pathExtension.lowercased()
                if ["jpg", "jpeg", "png", "heic", "mp4", "mov"].contains(ext) {
                    var date = (try? file.resourceValues(forKeys: [.creationDateKey]).creationDate) ?? Date()
                    if let d = parseDateFromFilename(file.lastPathComponent) {
                        date = d
                    }
                    
                    let type: MemoryAsset.MediaType = (ext == "mp4" || ext == "mov") ? .video : .image
                    assets.append(MemoryAsset(fileURL: file, creationDate: date, location: nil, mediaType: type))
                }
            }
        }
        return assets
    }
    
    private static func parseDateFromFilename(_ filename: String) -> Date? {
        // Common snap format: "2023-01-01_12-00-00.jpg" or similar
        // Or "2023-01-01 12:00:00.jpg"
        let range = NSRange(location: 0, length: filename.utf16.count)
        let regex = try? NSRegularExpression(pattern: #"(\d{4})-(\d{2})-(\d{2})"#)
        
        if let match = regex?.firstMatch(in: filename, options: [], range: range) {
             // Extract date components
             // For MVP, simple string parse
             let prefix = (filename as NSString).substring(with: match.range)
             let formatter = DateFormatter()
             formatter.dateFormat = "yyyy-MM-dd"
             return formatter.date(from: prefix)
        }
        return nil
    }
}
