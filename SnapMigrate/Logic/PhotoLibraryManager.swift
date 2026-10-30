import Photos
import UIKit

class PhotoLibraryManager {
    static let shared = PhotoLibraryManager()
    private let albumName = "Snapchat Memories"
    
    func requestAccess() async -> Bool {
        let status = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
        return status == .authorized || status == .limited
    }
    
    func importAssets(_ assets: [MemoryAsset], progressHandler: @escaping (Double) -> Void) async throws {
        // 1. Get or Create Album
        let album = try await getAlbum()
        
        // 2. Process in batches
        let batchSize = 10
        let total = Double(assets.count)
        
        for (index, chunk) in assets.chunked(into: batchSize).enumerated() {
            try await PHPhotoLibrary.shared().performChanges {
                let assetsToAdd = chunk.compactMap { asset -> PHObjectPlaceholder? in
                    let creationRequest: PHAssetCreationRequest
                    if asset.mediaType == .video {
                        creationRequest = PHAssetCreationRequest.creationRequestForAssetFromVideo(atFileURL: asset.fileURL)!
                    } else {
                        creationRequest = PHAssetCreationRequest.creationRequestForAssetFromImage(atFileURL: asset.fileURL)!
                    }
                    creationRequest.creationDate = asset.creationDate
                    if let location = asset.location {
                        creationRequest.location = CLLocation(latitude: location.latitude, longitude: location.longitude)
                    }
                    return creationRequest.placeholderForCreatedAsset
                }
                
                // Add to Album
                if let album = album, !assetsToAdd.isEmpty {
                    let albumChangeRequest = PHAssetCollectionChangeRequest(for: album)
                    albumChangeRequest?.addAssets(assetsToAdd as NSArray)
                }
            }
            
            let processedCount = (index + 1) * batchSize
            progressHandler(min(Double(processedCount) / total, 1.0))
        }
    }
    
    private func getAlbum() async throws -> PHAssetCollection? {
        let fetchOptions = PHFetchOptions()
        fetchOptions.predicate = NSPredicate(format: "title = %@", albumName)
        let collection = PHAssetCollection.fetchAssetCollections(with: .album, subtype: .any, options: fetchOptions)
        
        if let first = collection.firstObject {
            return first
        }
        
        // Create
        var placeholder: PHObjectPlaceholder?
        try await PHPhotoLibrary.shared().performChanges {
            let createAlbumRequest = PHAssetCollectionChangeRequest.creationRequestForAssetCollection(withTitle: self.albumName)
            placeholder = createAlbumRequest.placeholderForCreatedAssetCollection
        }
        
        if let id = placeholder?.localIdentifier {
            return PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [id], options: nil).firstObject
        }
        return nil
    }
}

extension Array {
    func chunked(into size: Int) -> [[Element]] {
        return stride(from: 0, to: count, by: size).map {
            Array(self[$0 ..< Swift.min($0 + size, count)])
        }
    }
}
