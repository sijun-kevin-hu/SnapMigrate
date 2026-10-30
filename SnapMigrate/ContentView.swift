import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = ImportViewModel()

    var body: some View {
        Group {
            switch viewModel.state {
            case .idle:
                WelcomeView(viewModel: viewModel)
            case .extracting, .scanning:
                ProgressView(
                    title: viewModel.state == .extracting ? "Extracting ZIP..." : "Scanning Metadata...",
                    progress: viewModel.progress,
                    currentFile: viewModel.currentStatus
                )
            case .readyToImport(let count, let range):
                ReviewView(viewModel: viewModel, count: count, dateRange: range)
            case .importing:
                ProgressView(
                    title: "Importing to Photos...",
                    progress: viewModel.progress,
                    currentFile: viewModel.currentStatus
                )
            case .completed(let summary):
                VStack(spacing: 20) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.green)
                    Text("Import Complete!")
                        .font(.title)
                        .fontWeight(.bold)
                    Text(summary)
                        .multilineTextAlignment(.center)
                        .padding()
                    Button("Done") {
                        viewModel.reset()
                    }
                    .buttonStyle(.borderedProminent)
                }
            case .error(let message):
                VStack(spacing: 20) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.red)
                    Text("Error")
                        .font(.title)
                        .fontWeight(.bold)
                    Text(message)
                        .multilineTextAlignment(.center)
                        .padding()
                    Button("Try Again") {
                        viewModel.reset()
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
        .animation(.easeInOut, value: viewModel.state)
    }
}
