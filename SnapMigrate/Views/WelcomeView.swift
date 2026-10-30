import SwiftUI
import UniformTypeIdentifiers

struct WelcomeView: View {
    @ObservedObject var viewModel: ImportViewModel
    @State private var isImporterPresented = false
    
    var body: some View {
        VStack(spacing: 30) {
            Image(systemName: "arrow.down.doc.fill")
                .font(.system(size: 80))
                .foregroundColor(.yellow)
            
            Text("SnapMigrate")
                .font(.largeTitle)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)
            
            Text("Select your 'my_data.zip' file to begin. We'll extract and import your memories directly to the Photos app.")
                .multilineTextAlignment(.center)
                .padding()
            
            Button {
                isImporterPresented = true
            } label: {
                Label("Select ZIP File", systemImage: "folder")
                    .font(.title2)
                    .padding()
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .padding(.horizontal)
            
            Text("Processing happens on-device.\nEnsure you have enough free space.")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .fileImporter(
            isPresented: $isImporterPresented,
            allowedContentTypes: [UTType.zip],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                if let url = urls.first {
                    viewModel.selectFile(url: url)
                }
            case .failure(let error):
                print(error.localizedDescription)
            }
        }
    }
}
