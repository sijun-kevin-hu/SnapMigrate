import SwiftUI
import Combine

@MainActor
class ImportViewModel: ObservableObject {
    @Published var state: ImportState = .idle
    @Published var progress: Double = 0.0
    @Published var currentStatus: String = ""
    
    private let zipExtractor = ZipExtractor()
    private let metadataParser = MetadataParser()
    private let photoManager = PhotoLibraryManager.shared
    
    private var tempDirectory: URL?
    private var textAssets: [MemoryAsset] = []
    
    func selectFile(url: URL) {
        state = .extracting
        currentStatus = "Preparing workspace..."
        
        Task {
            do {
                // 1. Create temp dir
                let tempDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
                try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true, attributes: nil)
                self.tempDirectory = tempDir
                
                // 2. Unzip
                // Using start/stop security scope is crucial for accessing user selected files
                if url.startAccessingSecurityScopedResource() {
                    defer { url.stopAccessingSecurityScopedResource() }
                    
                    try await zipExtractor.extract(source: url, destination: tempDir) { p in
                        self.progress = p * 0.5 // First half is extracting
                    }
                } else {
                    throw NSError(domain: "com.snapmigrate", code: 1, userInfo: [NSLocalizedDescriptionKey: "Permission denied"])
                }
                
                // 3. Scan
                self.state = .scanning
                self.currentStatus = "Analyzing metadata..."
                
                let assets = try await metadataParser.parse(directory: tempDir)
                self.textAssets = assets
                
                // 4. Update State
                let count = assets.count
                let range: String
                if let first = assets.first?.creationDate, let last = assets.last?.creationDate {
                    let formatter = DateFormatter()
                    formatter.dateStyle = .medium
                    range = "\(formatter.string(from: first)) - \(formatter.string(from: last))"
                } else {
                    range = "Unknown"
                }
                
                self.state = .readyToImport(count: count, dateRange: range)
                
            } catch {
                self.state = .error(message: error.localizedDescription)
                cleanup()
            }
        }
    }
    
    func startImport() {
        guard !textAssets.isEmpty else { return }
        
        Task {
            let authorized = await photoManager.requestAccess()
            guard authorized else {
                state = .error(message: "Photo Library access required")
                return
            }
            
            state = .importing
            progress = 0.0
            
            do {
                try await photoManager.importAssets(textAssets) { p in
                    Task { @MainActor in
                        self.progress = p
                        self.currentStatus = "Imported \(Int(p * Double(self.textAssets.count))) items"
                    }
                }
                state = .completed(summary: "Successfully imported \(textAssets.count) memories.")
            } catch {
                state = .error(message: "Import failed: \(error.localizedDescription)")
            }
            
            cleanup()
        }
    }
    
    func reset() {
        state = .idle
        progress = 0.0
        currentStatus = ""
        textAssets = []
        cleanup()
    }
    
    private func cleanup() {
        if let temp = tempDirectory {
            try? FileManager.default.removeItem(at: temp)
        }
        tempDirectory = nil
    }
}
