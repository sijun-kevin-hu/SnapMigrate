import SwiftUI

struct ProgressView: View {
    let title: String
    let progress: Double
    let currentFile: String
    
    var body: some View {
        VStack(spacing: 40) {
            Text(title)
                .font(.title2)
                .fontWeight(.semibold)
            
            SwiftUI.ProgressView(value: progress)
                .progressViewStyle(.linear)
                .padding(.horizontal)
            
            Text(currentFile)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}
