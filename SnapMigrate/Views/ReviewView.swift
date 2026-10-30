import SwiftUI

struct ReviewView: View {
    @ObservedObject var viewModel: ImportViewModel
    let count: Int
    let dateRange: String
    
    var body: some View {
        VStack(spacing: 30) {
            Text("Ready to Import")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            List {
                HStack {
                    Text("Total Items")
                    Spacer()
                    Text("\(count)")
                        .bold()
                }
                
                HStack {
                    Text("Date Range")
                    Spacer()
                    Text(dateRange)
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Text("Album")
                    Spacer()
                    Text("Snapchat Memories")
                }
            }
            .listStyle(.insetGrouped)
            .frame(height: 300)
            
            Button {
                viewModel.startImport()
            } label: {
                Label("Start Import", systemImage: "square.and.arrow.down")
                    .font(.title2)
                    .padding()
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .padding(.horizontal)
            
            Button("Cancel") {
                viewModel.reset()
            }
            .foregroundColor(.red)
        }
        .padding()
    }
}
