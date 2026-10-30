import Foundation

struct SnapchatMemoriesHistory: Codable {
    let savedMedia: [SavedMedia]

    enum CodingKeys: String, CodingKey {
        case savedMedia = "Saved Media"
    }
}

struct SavedMedia: Codable {
    let date: String
    let mediaType: String
    let uri: String // e.g., "memories__...jpg"

    // These fields might vary based on export version, making them optional
    let location: Location?
    
    enum CodingKeys: String, CodingKey {
        case date = "Date"
        case mediaType = "Media Type"
        case uri = "Download Link"
        case location = "Location"
    }
    
    // Custom decoding to handle variations if known, but for MVP we stick to standard known schema.
    // A common schema for 'memories_history.json' has:
    // "Date": "2023-01-01 12:00:00 UTC",
    // "Media Type": "Image" or "Video",
    // "Location": ...
    // "Download Link": "https://..." <- This is usually a cloud link.
    //
    // HOWEVER, in a "My Data" ZIP, the actual files are usually in a 'memories' folder, 
    // and maintaining the link between the file on disk and this metadata is the hardest part.
    // Often the files are named with the timestamp or a hash.
    // 
    // Strategy: We will scan the 'memories' directory for files.
    // We will try to match them to metadata by timestamp if filenames don't match exactly,
    // or rely on EXIF if present (often stripped in SC).
    //
    // Let's refine the model to what we expect in the JSON.
}

struct Location: Codable {
    let latitude: Double
    let longitude: Double
    
    enum CodingKeys: String, CodingKey {
        case latitude = "Latitude"
        case longitude = "Longitude"
    }
}

// Internal model for our app's logic
struct MemoryAsset: Identifiable {
    let id = UUID()
    let fileURL: URL
    let creationDate: Date
    let location: Location?
    let mediaType: MediaType
    
    enum MediaType {
        case image
        case video
    }
}
