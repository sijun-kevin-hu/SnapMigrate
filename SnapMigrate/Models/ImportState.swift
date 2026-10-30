import Foundation

enum ImportState: Equatable {
    case idle
    case extracting
    case scanning
    case readyToImport(count: Int, dateRange: String)
    case importing
    case completed(summary: String)
    case error(message: String)
    
    static func == (lhs: ImportState, rhs: ImportState) -> Bool {
        switch (lhs, rhs) {
        case (.idle, .idle): return true
        case (.extracting, .extracting): return true
        case (.scanning, .scanning): return true
        case (.readyToImport(let c1, let r1), .readyToImport(let c2, let r2)):
            return c1 == c2 && r1 == r2
        case (.importing, .importing): return true
        case (.completed(let s1), .completed(let s2)): return s1 == s2
        case (.error(let m1), .error(let m2)): return m1 == m2
        default: return false
        }
    }
}
