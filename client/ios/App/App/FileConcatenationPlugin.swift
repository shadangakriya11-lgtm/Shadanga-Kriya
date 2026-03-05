import Foundation
import Capacitor

@objc(FileConcatenationPlugin)
public class FileConcatenationPlugin: CAPPlugin {
    
    @objc func concatenateFiles(_ call: CAPPluginCall) {
        guard let outputPath = call.getString("outputPath"),
              let inputPathsArray = call.getArray("inputPaths", String.self) else {
            call.reject("Missing required parameters")
            return
        }
        
        let fileManager = FileManager.default
        let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let outputURL = documentsPath.appendingPathComponent(outputPath)
        
        do {
            // Create output file
            fileManager.createFile(atPath: outputURL.path, contents: nil, attributes: nil)
            let outputHandle = try FileHandle(forWritingTo: outputURL)
            
            var totalBytes: Int64 = 0
            let bufferSize = 8192
            
            for inputPath in inputPathsArray {
                let inputURL = documentsPath.appendingPathComponent(inputPath)
                
                guard fileManager.fileExists(atPath: inputURL.path) else {
                    try? outputHandle.close()
                    call.reject("Input file does not exist: \(inputPath)")
                    return
                }
                
                let inputHandle = try FileHandle(forReadingFrom: inputURL)
                
                // Read and write in chunks
                var shouldContinue = true
                while shouldContinue {
                    autoreleasepool {
                        let data = inputHandle.readData(ofLength: bufferSize)
                        if data.count > 0 {
                            outputHandle.write(data)
                            totalBytes += Int64(data.count)
                        } else {
                            shouldContinue = false
                        }
                    }
                }
                
                try inputHandle.close()
            }
            
            try outputHandle.close()
            
            call.resolve([
                "success": true,
                "totalBytes": totalBytes
            ])
            
        } catch {
            call.reject("Failed to concatenate files: \(error.localizedDescription)")
        }
    }
}
