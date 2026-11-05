import AppKit
import PDFKit

// macOS helper: preserve the supplied PDF's layout as browser-ready slide images.
let input = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "docs/assets/images/PPT.pdf"
let output = CommandLine.arguments.count > 2 ? CommandLine.arguments[2] : "docs/assets/images/projector"
guard let document = PDFDocument(url: URL(fileURLWithPath: input)) else {
    fputs("Cannot open presentation PDF: \(input)\n", stderr)
    exit(1)
}
try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
for index in 0..<document.pageCount {
    guard let page = document.page(at: index) else { continue }
    let image = page.thumbnail(of: NSSize(width: 1400, height: 1800), for: .mediaBox)
    guard let tiff = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let png = bitmap.representation(using: .png, properties: [:]) else {
        fputs("Cannot render page \(index + 1)\n", stderr)
        exit(1)
    }
    let name = String(format: "slide-%02d.png", index + 1)
    try png.write(to: URL(fileURLWithPath: output).appendingPathComponent(name))
    print("Rendered \(name)")
}
