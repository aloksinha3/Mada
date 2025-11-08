# Troubleshooting Patient Deletion

## If you're getting "Error deleting patient" error:

### 1. Check Backend Logs
Look at the backend server console for error messages. The improved error handling will show detailed error information.

### 2. Common Issues:

#### Issue: Patient doesn't exist
- **Solution**: The patient may have already been deleted. Refresh the page and try again.

#### Issue: Database lock
- **Solution**: Make sure no other process is using the database. Restart the backend server.

#### Issue: Foreign key constraints
- **Solution**: The code now properly handles this by deleting child records first (messages and calls) before deleting the patient.

#### Issue: Permission errors
- **Solution**: Make sure the database file (`patients.db`) has write permissions.

### 3. Test the Delete Function:

```bash
cd backend
python3 -c "
from database import Database
db = Database()
# Replace 1 with actual patient ID
result = db.delete_patient(1)
print(f'Delete result: {result}')
"
```

### 4. Check API Response:

The frontend now shows the actual error message from the API. Look for:
- Error details in the alert dialog
- Console errors in browser developer tools (F12)

### 5. Verify Backend is Running:

Make sure the backend server is running on port 8000:
```bash
cd backend
python -c "import sys; sys.path.append('.'); from main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)"
```

### 6. Check Network Tab:

In browser developer tools (F12), check the Network tab:
- Look for the DELETE request to `/patients/{id}`
- Check the response status code and body
- Verify the request is being sent correctly

## Recent Fixes:

1. ✅ Improved error handling in backend
2. ✅ Better error messages in frontend
3. ✅ Proper foreign key handling
4. ✅ Detailed logging for debugging

## If issue persists:

1. Check backend console for detailed error messages
2. Check browser console (F12) for frontend errors
3. Verify the patient ID is correct
4. Try restarting both backend and frontend servers

