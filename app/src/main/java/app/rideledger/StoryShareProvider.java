package app.rideledger;

import android.content.*;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.*;

/** Grants a chosen receiver read-only access to one generated story PNG, never ride exports. */
public final class StoryShareProvider extends ContentProvider {
 @Override public boolean onCreate(){return true;}
 private File file(Uri uri)throws FileNotFoundException{
  String name=uri.getLastPathSegment();
  if(name==null||!name.matches("odo-[a-f0-9-]{36}\\.png")||!("/"+name).equals(uri.getPath()))throw new FileNotFoundException();
  File directory=new File(getContext().getCacheDir(),"stories"),file=new File(directory,name);
  if(!file.isFile())throw new FileNotFoundException();return file;
 }
 @Override public ParcelFileDescriptor openFile(Uri uri,String mode)throws FileNotFoundException{if(!"r".equals(mode))throw new FileNotFoundException("Read only");return ParcelFileDescriptor.open(file(uri),ParcelFileDescriptor.MODE_READ_ONLY);}
 @Override public String getType(Uri uri){return "image/png";}
 @Override public Cursor query(Uri uri,String[] projection,String selection,String[] args,String sort){
  try{File f=file(uri);String[] columns=projection==null?new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE}:projection;MatrixCursor result=new MatrixCursor(columns);Object[] row=new Object[columns.length];for(int i=0;i<columns.length;i++){if(OpenableColumns.DISPLAY_NAME.equals(columns[i]))row[i]="odo-ride.png";else if(OpenableColumns.SIZE.equals(columns[i]))row[i]=f.length();}result.addRow(row);return result;}catch(FileNotFoundException e){return null;}
 }
 @Override public Uri insert(Uri uri,ContentValues values){throw new UnsupportedOperationException("Read only");}
 @Override public int update(Uri uri,ContentValues values,String selection,String[] args){throw new UnsupportedOperationException("Read only");}
 @Override public int delete(Uri uri,String selection,String[] args){throw new UnsupportedOperationException("Read only");}
}
