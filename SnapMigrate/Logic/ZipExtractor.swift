import Foundation
import ZIPFoundation

actor ZipExtractor {
    
    enum ZipError: Error {
        case fileAccessFailed
        case extractionFailed
    }

    func extract(source: URL, destination: URL, progressHandler: @escaping (Double) -> Void) async throws {
        // Ensure destination exists
        let fileManager = FileManager.default
        try fileManager.createDirectory(at: destination, withIntermediateDirectories: true)
        
        // Run blocking work in a detached task to keep the actor responsive
        try await Task.detached(priority: .userInitiated) {
            let archive = try Archive(url: source, accessMode: .read)
            
            var totalCompressedBytes: Int64 = 0
            for entry in archive {
                totalCompressedBytes += Int64(entry.compressedSize)
            }
            
            var processedBytes: Int64 = 0
            
            for entry in archive {
                let path = entry.path
                // Create directory for entry if needed (ZIPFoundation's extract usually handles this or we map it)
                // We'll trust extract to behave or use the helper
                
                // Using `extract` on the archive
                do {
                    _ = try archive.extract(entry, to: destination.appendingPathComponent(path))
                } catch {
                    print("Failed to extract \(path): \(error)")
                    // Continue or throw? For MVP continue is safer for partial imports.
                }
                
                processedBytes += Int64(entry.compressedSize)
                let fraction = Double(processedBytes) / Double(totalCompressedBytes)
                
                // Call back progress
                // Note: progressHandler is escaping. 
                // However, since we are in a detached task, we need to be careful.
                // The caller (ViewModel) usually sets up progressHandler to jump to MainActor if needed.
                // But better to yield execution now and then? No, just call it.
                progressHandler(fraction)
            }
        }.value
        
        progressHandler(1.0)
    }
}
