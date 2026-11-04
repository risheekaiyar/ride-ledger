package app.rideledger;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.*;
import android.widget.*;
import java.io.*;
import java.util.*;
import java.util.zip.*;

public class MainActivity extends Activity {
    private TextView status;
    private Spinner placement;
    private final java.util.LinkedHashMap<Integer,CheckBox> options=new java.util.LinkedHashMap<>();
    private File selected;
    private final Handler handler = new Handler();
    private final Runnable refresh = new Runnable() {
        public void run() {
            status.setText(RideService.liveStatus);
            handler.postDelayed(this, 1000);
        }
    };
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if(state!=null&&state.getString("exportRide")!=null)selected=new File(new File(getFilesDir(),"rides"),state.getString("exportRide"));
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(28,48,28,24);
        ScrollView scroll = new ScrollView(this); scroll.addView(root); setContentView(scroll);
        scroll.setOnApplyWindowInsetsListener((v,insets)->{root.setPadding(28+insets.getSystemWindowInsetLeft(),24+insets.getSystemWindowInsetTop(),28+insets.getSystemWindowInsetRight(),24+insets.getSystemWindowInsetBottom());return insets;});
        text(root,"RIDE LEDGER",30);
        text(root,"Your commute, recorded privately",19);
        text(root,"Start while parked. Lock the screen and ride normally. Stop after parking. No account, uploads or API charges. Raw exports include precise locations: share only with people you trust.",16);
        text(root,"Phone placement",16);
        placement = new Spinner(this);
        placement.setAdapter(new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,new String[]{"Pocket","Bag","Rigid mount"}));
        root.addView(placement);
        text(root,"Sensor options (availability depends on your phone)",17);
        for(int type:new int[]{1,4,11,9,10,2,5,6}){
            CheckBox box=new CheckBox(this);box.setText(RideService.sensorLabel(type));box.setChecked(type!=2&&type!=5);
            root.addView(box);options.put(type,box);
        }
        text(root,"Gravity-removed acceleration describes phone movement. Magnetic field and light are optional diagnostics; pocket light readings may be near zero. Extra sensors can increase battery use.",15);
        text(root,"Pocket/bag motion includes your body's movement. It cannot establish potholes, motorcycle lean, crashes, or riding safety.",15);
        status = text(root,RideService.liveStatus,18);
        button(root,"Start commute",v -> startRide());
        button(root,"Stop and save",v -> {
            if (RideService.running) startService(new Intent(this,RideService.class).setAction("STOP"));
            else toast("No recording is active");
        });
        button(root,"View saved rides",v -> showRides());
        button(root,"Export a saved ride (ZIP)",v -> chooseExport());
        text(root,"First test: record a short walk, save it, then export it. On Vivo, verify screen-off recording before relying on an office commute. A persistent recording notification should remain visible.",15);
        if(getIntent().getBooleanExtra("export",false))chooseExport();
    }
    private TextView text(LinearLayout root,String s,int size){TextView t=new TextView(this);t.setText(s);t.setTextSize(size);t.setPadding(0,10,0,14);root.addView(t);return t;}
    private void button(LinearLayout root,String s,android.view.View.OnClickListener click){Button b=new Button(this);b.setText(s);b.setOnClickListener(click);root.addView(b);}
    private void toast(String s){Toast.makeText(this,s,Toast.LENGTH_LONG).show();}
    private void startRide(){
        if(RideService.running){toast("Already recording");return;}
        if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},8);return;
        }
        if(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED){
            ArrayList<String> p=new ArrayList<>(Arrays.asList(Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION));
            if(Build.VERSION.SDK_INT>=33)p.add(Manifest.permission.POST_NOTIFICATIONS);
            requestPermissions(p.toArray(new String[0]),7);return;
        }
        Intent i=new Intent(this,RideService.class).putExtra("placement",placement.getSelectedItem().toString());
        int[] types=options.entrySet().stream().filter(e->e.getValue().isChecked()).mapToInt(e->e.getKey()).toArray();
        i.putExtra("sensorTypes",types);
        try{startForegroundService(i);}catch(RuntimeException e){toast("Cannot start recorder. Keep the app visible, check permissions and retry.");}
    }
    @Override public void onRequestPermissionsResult(int r,String[] p,int[] g){super.onRequestPermissionsResult(r,p,g);if(r==7)toast("Permissions updated. Tap Start commute again. Precise location is required for this test.");if(r==8)toast("Enable notifications in Android app settings, then tap Start. This keeps Stop accessible while the screen is locked.");}
    private File[] rides(){File dir=new File(getFilesDir(),"rides");File[] list=dir.listFiles(File::isDirectory);if(list==null)return new File[0];Arrays.sort(list,(a,b)->b.getName().compareTo(a.getName()));return list;}
    private void showRides(){
        File[] list=rides();if(list.length==0){toast("No saved rides yet");return;}
        String[] names=Arrays.stream(list).map(File::getName).toArray(String[]::new);
        new AlertDialog.Builder(this).setTitle("Saved rides").setItems(names,(d,n)->{
            File f=new File(list[n],"summary.json");String content;
            try{content=new String(java.nio.file.Files.readAllBytes(f.toPath()),java.nio.charset.StandardCharsets.UTF_8);
                File details=new File(list[n],"sensor_summary.json");
                if(details.exists()){
                    org.json.JSONArray rows=new org.json.JSONArray(new String(java.nio.file.Files.readAllBytes(details.toPath()),java.nio.charset.StandardCharsets.UTF_8));
                    StringBuilder readable=new StringBuilder("Phone sensor measurements\n");
                    for(int j=0;j<rows.length();j++){org.json.JSONObject row=rows.getJSONObject(j);
                        readable.append(row.getString("label")).append(": ").append(row.getLong("samples")).append(" samples");
                        if(row.getLong("samples")>0)readable.append(String.format(Locale.US,"\nMean %.2f · RMS %.2f · peak %.2f %s\n%.1f Hz · largest gap %.3f s",row.getDouble("mean_magnitude"),row.getDouble("rms_magnitude"),row.getDouble("peak_magnitude"),row.getString("unit"),row.getDouble("effective_hz"),row.getDouble("max_gap_seconds")));
                        readable.append("\n\n");}
                    content=readable+"Phone motion only; no calibrated road or riding score.\n\nRecording details:\n"+content;
                }
            }catch(Exception e){content="Recording is incomplete or still active. Raw samples remain available.";}
            new AlertDialog.Builder(this).setTitle(names[n]).setMessage(content).setPositiveButton("OK",null).show();
        }).show();
    }
    private void chooseExport(){
        if(RideService.running){toast("Stop recording before exporting");return;}
        File[] list=rides();if(list.length==0){toast("No recordings to export");return;}
        new AlertDialog.Builder(this).setTitle("Export includes precise route + motion data").setItems(Arrays.stream(list).map(File::getName).toArray(String[]::new),(d,n)->{
            selected=list[n];Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/zip").addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE,selected.getName()+".zip");startActivityForResult(i,9);
        }).setNegativeButton("Cancel",null).show();
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request!=9||result!=RESULT_OK||data==null||data.getData()==null||selected==null)return;
        File source=selected; android.net.Uri uri=data.getData();
        if(RideService.running){toast("Stop recording before exporting; retry export after saving.");return;}
        new Thread(()->{
            try(OutputStream out=getContentResolver().openOutputStream(uri);ZipOutputStream zip=new ZipOutputStream(out)){
                File[] files=source.listFiles();if(files==null)throw new IOException("Ride unavailable");
                byte[] bytes=new byte[8192];for(File f:files){if(!f.isFile())continue;zip.putNextEntry(new ZipEntry(f.getName()));try(InputStream in=new FileInputStream(f)){int n;while((n=in.read(bytes))!=-1)zip.write(bytes,0,n);}zip.closeEntry();}
                runOnUiThread(()->toast("Export saved"));
            }catch(Exception e){runOnUiThread(()->toast("Export failed; your original recording is retained"));}
        }).start();
    }
    @Override protected void onResume(){super.onResume();handler.post(refresh);}
    @Override protected void onPause(){handler.removeCallbacks(refresh);super.onPause();}
    @Override protected void onSaveInstanceState(Bundle out){super.onSaveInstanceState(out);if(selected!=null)out.putString("exportRide",selected.getName());}
}
