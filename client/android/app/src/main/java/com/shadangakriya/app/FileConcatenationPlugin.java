package com.shadangakriya.app;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "FileConcatenation")
public class FileConcatenationPlugin extends Plugin {

    @PluginMethod
    public void concatenateFiles(PluginCall call) {
        String outputPath = call.getString("outputPath");
        JSArray inputPathsArray = call.getArray("inputPaths");
        
        if (outputPath == null || inputPathsArray == null) {
            call.reject("Missing required parameters");
            return;
        }

        try {
            // Convert JSArray to String array
            List<String> inputPathsList = new ArrayList<>();
            for (int i = 0; i < inputPathsArray.length(); i++) {
                inputPathsList.add(inputPathsArray.getString(i));
            }
            String[] inputPaths = inputPathsList.toArray(new String[0]);
            
            if (inputPaths.length == 0) {
                call.reject("No input paths provided");
                return;
            }

            File outputFile = new File(getContext().getFilesDir(), outputPath);
            FileOutputStream fos = new FileOutputStream(outputFile);

            byte[] buffer = new byte[8192];
            int bytesRead;
            long totalBytes = 0;

            for (String inputPath : inputPaths) {
                File inputFile = new File(getContext().getFilesDir(), inputPath);
                
                if (!inputFile.exists()) {
                    fos.close();
                    call.reject("Input file does not exist: " + inputPath);
                    return;
                }

                FileInputStream fis = new FileInputStream(inputFile);
                while ((bytesRead = fis.read(buffer)) != -1) {
                    fos.write(buffer, 0, bytesRead);
                    totalBytes += bytesRead;
                }
                fis.close();
            }

            fos.close();

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("totalBytes", totalBytes);
            call.resolve(result);

        } catch (IOException e) {
            call.reject("Failed to concatenate files: " + e.getMessage());
        } catch (JSONException e) {
            call.reject("Failed to parse input paths: " + e.getMessage());
        }
    }
}
