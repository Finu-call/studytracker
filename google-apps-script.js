/**
 * BACKEND CODE FOR GOOGLE SHEETS
 * 
 * Instructions:
 * 1. Go to https://script.google.com/home
 * 2. Click "New Project"
 * 3. Paste this code into the editor (replace Code.gs content)
 * 4. Click "Deploy" > "New Deployment"
 * 5. Select type: "Web app"
 * 6. Set "Who has access" to "Anyone" (Important for the app to reach it)
 * 7. Click "Deploy" and copy the "Web App URL"
 * 8. Paste that URL into the Study Tracker App settings.
 */

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const sheet = SpreadsheetApp.getActiveSpreadsheet();

        // --- ROUTINES ---
        if (data.type === 'sync_routines') {
            let rSheet = sheet.getSheetByName('Routines');
            if (!rSheet) { rSheet = sheet.insertSheet('Routines'); rSheet.appendRow(['ID', 'Title', 'Time', 'Type', 'Completed', 'Timestamp']); }

            // Clear old status (simplified sync) and re-log
            // Ideally we would update by ID, but simpler to append new log for "Live Stream" feel
            const timestamp = new Date().toISOString();

            data.routines.forEach(r => {
                rSheet.appendRow([r.id, r.title, r.time, r.type, r.completed, timestamp]);
            });

            return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Routines synced' })).setMimeType(ContentService.MimeType.JSON);
        }

        // --- STUDY SESSION ---
        if (data.type === 'log_session') {
            let sSheet = sheet.getSheetByName('StudyLogs');
            if (!sSheet) { sSheet = sheet.insertSheet('StudyLogs'); sSheet.appendRow(['Subject', 'Duration', 'Timestamp']); }

            sSheet.appendRow([data.session.subject, data.session.duration, data.session.date]);

            return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Session logged' })).setMimeType(ContentService.MimeType.JSON);
        }

        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unknown type' })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
}

function doGet(e) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'active', message: 'Server is running' })).setMimeType(ContentService.MimeType.JSON);
}
