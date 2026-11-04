package app.rideledger;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorManager;
import android.location.LocationManager;
import android.net.Uri;
import android.os.*;
import android.util.Base64;
import android.webkit.*;
import android.widget.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.zip.*;
import org.json.*;

/** App-owned HTTPS assets only. The Java bridge is never exposed to remote pages. */
public class DashboardActivity extends Activity {
    private static final String ORIGIN="https://odo.local/";
    private WebView web;
    private CompanionClient companion;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private final java.util.concurrent.atomic.AtomicBoolean sharingClip=new java.util.concurrent.atomic.AtomicBoolean();
    private ValueCallback<Uri[]> fileChoice;
    private boolean widgetPending=false,destroyed=false;
    private boolean dashboardReady=false,setupPending=false;
    private String pendingPlacement;
    private String activityType="ride";
    private String recordingContext="{}";
    private int[] pendingTypes;
    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(0xff101313);
        TextView tools=new TextView(this);tools.setText("  ODO   ·   Recorder controls & original ZIP export  ↗");tools.setTextSize(11);tools.setTextColor(0xffb8c5a8);tools.setPadding(10,12,10,12);tools.setOnClickListener(v->startActivity(new Intent(this,MainActivity.class)));
        root.addView(tools);web=new WebView(this);root.addView(web,new LinearLayout.LayoutParams(-1,0,1));setContentView(root);
        root.setOnApplyWindowInsetsListener((v,insets)->{root.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;});
        WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setUserAgentString(settings.getUserAgentString()+" OdoRideLedger/0.3.0 (+https://github.com/risheekaiyar/ride-ledger)");
        web.addJavascriptInterface(new Bridge(),"RideNative");
        companion=new CompanionClient(this);
        web.addJavascriptInterface(new CompanionBridge(),"OdoNativeCompanion");
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest r){return true;}
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                Uri u=request.getUrl();
                if("https".equals(u.getScheme())&&"odo.local".equals(u.getHost())){
                    String p=u.getPath();if(p==null||p.contains("..")||p.contains("\\"))return blocked();if(p.equals("/"))p="/index.html";
                    try{String mime=p.endsWith(".js")?"text/javascript":p.endsWith(".css")?"text/css":p.endsWith(".svg")?"image/svg+xml":p.endsWith(".webm")?"video/webm":p.endsWith(".jpg")?"image/jpeg":p.endsWith(".json")?"application/json":p.endsWith(".webmanifest")?"application/manifest+json":"text/html";
                        WebResourceResponse response=new WebResourceResponse(mime,"UTF-8",getAssets().open("odo"+p));
                        response.setResponseHeaders(Collections.singletonMap("Content-Security-Policy","default-src 'self'; script-src 'self' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tile.openstreetmap.org https://upload.wikimedia.org; media-src 'self' blob:; connect-src 'self' https://tile.openstreetmap.org https://commons.wikimedia.org; worker-src 'self' blob:; frame-src 'none'; object-src 'none'; base-uri 'none'"));return response;
                    }catch(IOException e){return blocked();}
                }
                if("https".equals(u.getScheme())&&Arrays.asList("tile.openstreetmap.org","commons.wikimedia.org","upload.wikimedia.org").contains(u.getHost()))return null;
                return blocked();
            }
            private WebResourceResponse blocked(){return new WebResourceResponse("text/plain","UTF-8",403,"Blocked",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
                if(fileChoice!=null)fileChoice.onReceiveValue(null);fileChoice=callback;
                try{startActivityForResult(params.createIntent(),22);return true;}catch(Exception e){fileChoice=null;toast("Cannot open media picker");return false;}
            }
        });
        web.loadUrl(getPackageName().endsWith(".experience") ? ORIGIN+"?experience=demo" : ORIGIN);if("CONFIGURE_COMPANION".equals(getIntent().getAction()))main.post(()->companion.configure(this));widgetPending="WIDGET_TOGGLE".equals(getIntent().getAction());
    }
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);if("CONFIGURE_COMPANION".equals(intent.getAction()))companion.configure(this);widgetPending="WIDGET_TOGGLE".equals(intent.getAction());if(hasWindowFocus())onWindowFocusChanged(true);}
    @Override public void onWindowFocusChanged(boolean focused){super.onWindowFocusChanged(focused);if(focused&&widgetPending){widgetPending=false;if(RideService.running)stopRide();else setupPending=true;}if(focused)openPendingSetup();}
    private void openPendingSetup(){if(setupPending&&dashboardReady&&hasWindowFocus()){setupPending=false;if(!RideService.running)js("window.odoOpenRecordingSetup&&window.odoOpenRecordingSetup()");}}
    private void startRide(String placement,int[] types){
        if(RideService.running){toast("Already recording");return;}
        LocationManager locationManager=getSystemService(LocationManager.class);
        if(locationManager==null||!locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)){toast("Enable phone location before starting your journey.");return;}
        if(placement==null)placement="Pocket";
        if(types==null)types=new int[]{1,4,11,9,10};
        pendingPlacement=placement;pendingTypes=types;
        ArrayList<String> needed=new ArrayList<>();
        if(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED){needed.add(Manifest.permission.ACCESS_FINE_LOCATION);needed.add(Manifest.permission.ACCESS_COARSE_LOCATION);}
        if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)needed.add(Manifest.permission.POST_NOTIFICATIONS);
        if(!needed.isEmpty()){requestPermissions(needed.toArray(new String[0]),12);return;}
        getPreferences(0).edit().putString("placement",placement).apply();
        try{startForegroundService(new Intent(this,RideService.class).putExtra("placement",placement).putExtra("sensorTypes",types).putExtra("activityType",activityType).putExtra("rideContext",recordingContext));toast("Recording started. Stop after parking.");}catch(Exception e){toast("Start failed. Keep the app visible and check permissions.");}
    }
    private void stopRide(){if(RideService.running)startService(new Intent(this,RideService.class).setAction("STOP"));}
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results){super.onRequestPermissionsResult(code,permissions,results);if(code==12){boolean ok=checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED&&(Build.VERSION.SDK_INT<33||checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED);if(ok)startRide(pendingPlacement,pendingTypes);else toast("Precise location and notifications are required. Use Start again after granting them.");}}
    private void js(String code){main.post(()->{if(!destroyed)web.evaluateJavascript(code,null);});}
    private void toast(String s){main.post(()->Toast.makeText(this,s,Toast.LENGTH_LONG).show());}
    private void clipReply(String id,String error){js("window.odoClipShared&&window.odoClipShared("+JSONObject.quote(id)+","+(error==null?"null":JSONObject.quote(error))+")");}
    private void error(String s){js("window.odoNativeError&&window.odoNativeError("+JSONObject.quote(s)+")");}
    private void sendZip(String id,InputStream in){
        try(InputStream source=in;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;long total=0;while((n=source.read(b))!=-1){total+=n;if(total>40L*1024*1024)throw new IOException("Too large");out.write(b,0,n);}String encoded=Base64.encodeToString(out.toByteArray(),Base64.NO_WRAP);js("window.odoNativeRide("+JSONObject.quote(id)+","+JSONObject.quote(encoded)+")");}catch(Exception e){error("Import failed or ZIP exceeds 40 MB. Original files are unchanged.");}
    }
    public final class CompanionBridge {
        @JavascriptInterface public void configure(){main.post(()->companion.configure(DashboardActivity.this));}
        @JavascriptInterface public void request(String id,String method,String body){
            if(!id.matches("[0-9]{1,12}")||body==null||body.length()>("FRAME".equals(method)?CompanionClient.FRAME_BODY_LIMIT:12000)||!Arrays.asList("GET","POST","FRAME").contains(method))return;
            io.execute(()->{JSONObject result=companion.request(method,body);js("window.odoCompanionReply&&window.odoCompanionReply("+JSONObject.quote(id)+","+result.toString()+")");});
        }
    }
    public final class Bridge {
        @JavascriptInterface public void ready(){main.post(()->{dashboardReady=true;openPendingSetup();});}
        @JavascriptInterface public String recordingCapabilities(){
            try{
                SensorManager manager=getSystemService(SensorManager.class);
                LocationManager locationManager=getSystemService(LocationManager.class);
                JSONArray list=new JSONArray();
                for(int type:new int[]{1,4,11,9,10,2,5,6}){
                    Sensor sensor=manager==null?null:manager.getDefaultSensor(type);
                    JSONObject item=new JSONObject().put("type",type).put("available",sensor!=null);
                    if(sensor!=null)item.put("name",sensor.getName()).put("resolution",sensor.getResolution()).put("maximum_range",sensor.getMaximumRange());
                    list.put(item);
                }
                return new JSONObject().put("schema",1).put("sensors",list)
                    .put("gps_enabled",locationManager!=null&&locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER))
                    .put("precise_location",checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED)
                    .put("notifications",Build.VERSION.SDK_INT<33||checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED).toString();
            }catch(Exception error){return "{\"schema\":1,\"status\":\"unavailable\"}";}
        }
        @JavascriptInterface public void openLocationSettings(){main.post(()->{try{startActivity(new Intent(android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS));}catch(Exception error){toast("Open Location in Android settings.");}});}
        @JavascriptInterface public void shareStory(String data){
            if(data==null||!data.startsWith("data:image/png;base64,")||data.length()>12*1024*1024){toast("Story image is too large or unsupported.");return;}
            io.execute(()->{try{
                byte[] bytes=Base64.decode(data.substring(22),Base64.DEFAULT);
                android.graphics.BitmapFactory.Options options=new android.graphics.BitmapFactory.Options();options.inJustDecodeBounds=true;
                android.graphics.BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);
                if(!"image/png".equals(options.outMimeType)||options.outWidth<1||options.outHeight<1||options.outWidth>2160||options.outHeight>3840)throw new IOException("Invalid story image");
                File directory=new File(getCacheDir(),"stories");if(!directory.exists()&&!directory.mkdirs())throw new IOException();
                File[] previous=directory.listFiles();if(previous!=null)for(File f:previous)if(StoryMedia.validName(f.getName())&&System.currentTimeMillis()-f.lastModified()>86400000L)f.delete();
                File image=new File(directory,"odo-"+UUID.randomUUID()+".png");try(FileOutputStream out=new FileOutputStream(image)){out.write(bytes);}
                Uri uri=Uri.parse("content://"+getPackageName()+".stories/"+image.getName());
                main.post(()->{if(destroyed)return;Intent share=new Intent(Intent.ACTION_SEND).setType("image/png").putExtra(Intent.EXTRA_STREAM,uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);share.setClipData(ClipData.newRawUri("Odo ride story",uri));try{startActivity(Intent.createChooser(share,"Share your Odo story"));}catch(Exception e){toast("No app is available to share this image.");}});
            }catch(Exception e){toast("Could not prepare story image. Original ride data is unchanged.");}});
        }

        @JavascriptInterface public void shareClip(String id,String data){
            if(id==null||!id.matches("clip_[a-f0-9]{32}"))return;
            String extension=StoryMedia.videoExtension(data);
            if(extension==null){clipReply(id,"Clip format or size is unsupported.");return;}
            if(!sharingClip.compareAndSet(false,true)){clipReply(id,"Another clip is being prepared. Try again shortly.");return;}
            try{io.execute(()->{
                File output=null;
                try{
                    byte[] bytes=Base64.decode(data.substring(data.indexOf(',')+1),Base64.DEFAULT);
                    if(!StoryMedia.videoHeader(bytes,extension))throw new IOException("Invalid video header");
                    File directory=new File(getCacheDir(),"stories");if(!directory.exists()&&!directory.mkdirs())throw new IOException();
                    File[] previous=directory.listFiles();if(previous!=null)for(File f:previous)if(StoryMedia.validName(f.getName())&&System.currentTimeMillis()-f.lastModified()>86400000L)f.delete();
                    output=new File(directory,"odo-"+UUID.randomUUID()+"."+extension);try(FileOutputStream out=new FileOutputStream(output)){out.write(bytes);}
                    android.media.MediaMetadataRetriever reader=new android.media.MediaMetadataRetriever();
                    try{
                        reader.setDataSource(output.getAbsolutePath());
                        if(!"yes".equals(reader.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_HAS_VIDEO))||"yes".equals(reader.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_HAS_AUDIO))||!StoryMedia.videoBounds(reader.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH),reader.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT),reader.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_DURATION)))throw new IOException("Unsupported video dimensions or duration");
                    }finally{reader.release();}
                    File ready=output;Uri uri=Uri.parse("content://"+getPackageName()+".stories/"+ready.getName());
                    main.post(()->{
                        try{
                            if(destroyed){ready.delete();return;}
                            Intent share=new Intent(Intent.ACTION_SEND).setType(StoryMedia.mime(ready.getName())).putExtra(Intent.EXTRA_STREAM,uri).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                            share.setClipData(ClipData.newRawUri("Odo ride clip",uri));startActivity(Intent.createChooser(share,"Share your Odo clip"));clipReply(id,null);
                        }catch(Exception error){ready.delete();clipReply(id,"No app is available to share this clip.");}finally{sharingClip.set(false);}
                    });
                }catch(Exception error){if(output!=null)output.delete();sharingClip.set(false);clipReply(id,"Android could not read this clip. Try a PNG poster or another video format.");}
            });}catch(RejectedExecutionException error){sharingClip.set(false);clipReply(id,"The app is closing. Reopen Odo to share the clip.");}
        }

        @JavascriptInterface public void companionBubble(){main.post(()->{
            if(!android.provider.Settings.canDrawOverlays(DashboardActivity.this)){
                startActivity(new Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,Uri.parse("package:"+getPackageName())));
                toast("Allow display over other apps, then tap Enable bubble again.");return;
            }
            try{startForegroundService(new Intent(DashboardActivity.this,CompanionBubbleService.class));}catch(RuntimeException e){toast("Unable to start bubble. Check overlay permissions.");}
        });}

        @JavascriptInterface public void state(){js("window.odoNativeState("+RideService.running+","+JSONObject.quote(RideService.liveStatus)+")");}
        @JavascriptInterface public void start(String placement,String sensorJson,String activity,String contextJson){
            if(!Arrays.asList("Pocket","Bag","Rigid mount").contains(placement))return;
            try{JSONObject supplied=new JSONObject(contextJson),context=new JSONObject();
                String bike=supplied.optString("bike_id","").trim(),type=supplied.optString("bike_type","Unknown"),mount=supplied.optString("mount_condition","Unknown");
                if(bike.length()>100||!Arrays.asList("Unknown","Adventure","Sport","Touring","Roadster","Cruiser","Scooter","Off-road").contains(type)||!Arrays.asList("Unknown","Stable","Slipping","Not mounted").contains(mount))return;
                if(!"Rigid mount".equals(placement))mount="Not mounted";
                else if("Not mounted".equals(mount))mount="Unknown";
                context.put("bike_id",bike).put("bike_type",type).put("mount_condition",mount);
                String model=supplied.optString("bike_model",""),color=supplied.optString("bike_color",""),family=supplied.optString("bike_family","");
                if(model.matches("[a-z0-9-]{1,60}"))context.put("bike_model",model);
                if(color.matches("#[a-fA-F0-9]{6}"))context.put("bike_color",color);
                if(Arrays.asList("adventure","rally","sport","naked","classic","touring","scooter").contains(family))context.put("bike_family",family);
                JSONArray input=new JSONArray(sensorJson);ArrayList<Integer> list=new ArrayList<>();for(int i=0;i<input.length()&&i<8;i++){int t=input.getInt(i);if(Arrays.asList(1,4,11,9,10,2,5,6).contains(t)&&!list.contains(t))list.add(t);}int[] types=list.stream().mapToInt(Integer::intValue).toArray();main.post(()->{recordingContext=context.toString();activityType="walk".equals(activity)?"walk":"ride";startRide(placement,types);});}catch(JSONException ignored){}
        }
        @JavascriptInterface public void stop(){main.post(()->stopRide());}
        @JavascriptInterface public void listRides(){io.execute(()->{try{JSONArray list=new JSONArray();File[] dirs=new File(getFilesDir(),"rides").listFiles(File::isDirectory);if(dirs!=null){Arrays.sort(dirs,Comparator.comparing(File::getName));for(File d:dirs)if(new File(d,"summary.json").isFile())list.put(new JSONObject().put("id",d.getName()));}js("window.odoNativeList("+list+")");}catch(Exception e){error("Could not list recordings.");}});}
        @JavascriptInterface public void readRide(String id){if(!id.matches("[0-9]{8}-[0-9]{6}-[0-9]{3}")){error("Invalid recording name.");return;}io.execute(()->{
            if(RideService.running){error("Stop recording before loading saved rides.");return;}
            File folder=new File(new File(getFilesDir(),"rides"),id);try(ByteArrayOutputStream buffer=new ByteArrayOutputStream()){
                long total=0;try(ZipOutputStream zip=new ZipOutputStream(buffer)){for(String name:new String[]{"metadata.json","summary.json","gps.csv","motion.csv","events.csv"}){File f=new File(folder,name);if(!f.isFile())continue;total+=f.length();if(total>100L*1024*1024)throw new IOException("Recording exceeds review limit");zip.putNextEntry(new ZipEntry(name));try(InputStream in=new FileInputStream(f)){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)zip.write(b,0,n);}zip.closeEntry();}}
                sendZip(id,new ByteArrayInputStream(buffer.toByteArray()));
            }catch(Exception e){error("This recording is unavailable or too large for phone review. Export the original ZIP.");}
        });}
        @JavascriptInterface public void importZip(){main.post(()->{if(RideService.running){toast("Stop recording before importing.");return;}startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("application/zip").addCategory(Intent.CATEGORY_OPENABLE),21);});}
        @JavascriptInterface public void exportRide(){main.post(()->startActivity(new Intent(DashboardActivity.this,MainActivity.class).putExtra("export",true)));}
    }
    @Override protected void onActivityResult(int code,int result,Intent data){super.onActivityResult(code,result,data);if(code==22&&fileChoice!=null){fileChoice.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileChoice=null;return;}if(code==21&&result==RESULT_OK&&data!=null&&data.getData()!=null){Uri uri=data.getData();io.execute(()->{try{sendZip("Imported recording",getContentResolver().openInputStream(uri));}catch(Exception e){error("Could not open that ZIP.");}});}}
    @Override protected void onDestroy(){destroyed=true;if(fileChoice!=null)fileChoice.onReceiveValue(null);web.removeJavascriptInterface("RideNative");web.removeJavascriptInterface("OdoNativeCompanion");web.destroy();io.shutdownNow();super.onDestroy();}
}
