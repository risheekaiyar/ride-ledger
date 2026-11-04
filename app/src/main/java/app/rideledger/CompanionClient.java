package app.rideledger;

import android.app.*;
import android.content.*;
import android.security.keystore.*;
import android.text.InputType;
import android.util.Base64;
import android.widget.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;
import javax.net.ssl.HttpsURLConnection;
import org.json.*;

/** Native-only client credential storage and TLS transport. Never exposes tokens to JavaScript. */
public final class CompanionClient {
    private static final String ALIAS="odo-companion-client-v1";
    static final int FRAME_BODY_LIMIT=136000;
    private final Context context;
    private final android.content.SharedPreferences prefs;
    public CompanionClient(Context context){this.context=context;this.prefs=context.getSharedPreferences("odo-companion",Context.MODE_PRIVATE);}
    private javax.crypto.SecretKey key()throws Exception{
        KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);
        if(!store.containsAlias(ALIAS)){
            KeyGenerator generator=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());generator.generateKey();
        }
        return (javax.crypto.SecretKey)store.getKey(ALIAS,null);
    }
    private void save(String endpoint,String token)throws Exception{
        if(token.length()<32||token.length()>512||!token.matches("[A-Za-z0-9_\\-]+"))throw new IllegalArgumentException("Use the randomly generated client token, not a Meta API key.");
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key());
        String encrypted=Base64.encodeToString(cipher.doFinal(token.getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP),iv=Base64.encodeToString(cipher.getIV(),Base64.NO_WRAP);
        if(!prefs.edit().putString("endpoint",CompanionEndpoint.validate(endpoint)).putString("token",encrypted).putString("iv",iv).commit())throw new IOException("Could not save configuration");
    }
    private String token()throws Exception{
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.decode(prefs.getString("iv",""),Base64.NO_WRAP)));
        return new String(cipher.doFinal(Base64.decode(prefs.getString("token",""),Base64.NO_WRAP)),StandardCharsets.UTF_8);
    }
    public void configure(Activity activity){
        LinearLayout layout=new LinearLayout(activity);layout.setOrientation(LinearLayout.VERTICAL);layout.setPadding(40,20,40,10);
        TextView description=new TextView(activity);description.setText("Connect to your authenticated Odo HTTPS gateway. The client token stays in Android's encrypted storage. Never enter the Meta provider key here.");layout.addView(description);
        EditText endpoint=new EditText(activity);endpoint.setHint("https://your-odo-server.example");endpoint.setSingleLine();endpoint.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_URI);endpoint.setText(prefs.getString("endpoint",""));layout.addView(endpoint);
        EditText token=new EditText(activity);token.setHint("Client access token");token.setSingleLine();token.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);layout.addView(token);
        AlertDialog dialog=new AlertDialog.Builder(activity).setTitle("Odo companion connection").setView(layout).setPositiveButton("Save",null).setNegativeButton("Cancel",null).setNeutralButton("Disconnect",(d,w)->{prefs.edit().clear().apply();Toast.makeText(activity,"Companion disconnected",Toast.LENGTH_SHORT).show();}).create();
        dialog.setOnShowListener(d->dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{try{save(endpoint.getText().toString(),token.getText().toString().trim());dialog.dismiss();Toast.makeText(activity,"Connection saved. Open the companion to test it.",Toast.LENGTH_LONG).show();}catch(Exception e){token.setError(e instanceof IllegalArgumentException?e.getMessage():"Secure storage unavailable. Connection was not saved.");}}));dialog.show();
    }
    public JSONObject request(String method,String body){
        HttpsURLConnection connection=null;
        try{
            String endpoint=prefs.getString("endpoint","");
            if(endpoint.isEmpty())return new JSONObject().put("ok",false).put("error","Configure your HTTPS companion gateway in Settings first.");
            boolean frame=method.equals("FRAME");
            boolean creative=method.equals("POST")&&new JSONObject(body).has("creative");
            if(!frame&&!method.equals("GET")&&!method.equals("POST"))throw new IllegalArgumentException();
            byte[] bytes=body.getBytes(StandardCharsets.UTF_8);if(bytes.length>(frame?FRAME_BODY_LIMIT:12000))throw new IllegalArgumentException();
            URL url=new URL(CompanionEndpoint.validate(endpoint)+(method.equals("GET")?"/api/muse/status":frame?"/api/muse/frame":"/api/muse/insights"));
            if(frame)method="POST";
            connection=(HttpsURLConnection)url.openConnection();connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(10000);connection.setReadTimeout(55000);connection.setRequestMethod(method);connection.setRequestProperty("Authorization","Bearer "+token());
            if(method.equals("POST")){connection.setDoOutput(true);connection.setRequestProperty("Content-Type","application/json");connection.setFixedLengthStreamingMode(bytes.length);try(OutputStream out=connection.getOutputStream()){out.write(bytes);}}
            int status=connection.getResponseCode();if(status>=300&&status<400)throw new IOException("Redirect rejected");
            InputStream stream=status>=400?connection.getErrorStream():connection.getInputStream();if(stream==null)throw new IOException();
            try(InputStream in=stream;ByteArrayOutputStream buffer=new ByteArrayOutputStream()){byte[] chunk=new byte[4096];int n;while((n=in.read(chunk))!=-1){if(buffer.size()+n>(creative?8*1024*1024:65536))throw new IOException();buffer.write(chunk,0,n);}JSONObject data=new JSONObject(buffer.toString("UTF-8"));return new JSONObject().put("ok",status>=200&&status<300).put("data",data);}
        }catch(Exception e){try{return new JSONObject().put("ok",false).put("error","Connection failed. Check the gateway address, trusted TLS certificate, client token and server allowance.");}catch(JSONException impossible){throw new IllegalStateException(impossible);}}
        finally{if(connection!=null)connection.disconnect();}
    }
}
