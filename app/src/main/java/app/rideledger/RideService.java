package app.rideledger;

import android.app.*;
import android.content.*;
import android.hardware.*;
import android.location.*;
import android.os.*;
import org.json.*;
import java.io.*;
import java.text.SimpleDateFormat;
import java.util.*;

public class RideService extends Service implements SensorEventListener, LocationListener {
    public static volatile boolean running=false;
    public static volatile String liveStatus="Ready. No recording active.";
    private HandlerThread thread;
    private Handler worker;
    private SensorManager sensors;
    private LocationManager locations;
    private PowerManager.WakeLock wake;
    private BufferedWriter gps,motion;
    private File folder;
    private long startWall,startElapsed,lastFlush;
    private long gpsCount=0,sensorCount=0,rejected=0;
    private double distance=0;
    private Location previous;
    private volatile boolean closing=false;
    private String placement="Pocket";
    private final HashMap<Integer,Long> lastSample=new HashMap<>();
    @Override public void onCreate(){
        super.onCreate();thread=new HandlerThread("ride-recorder");thread.start();worker=new Handler(thread.getLooper());
        sensors=(SensorManager)getSystemService(SENSOR_SERVICE);locations=(LocationManager)getSystemService(LOCATION_SERVICE);
        NotificationManager nm=getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel("recording","Ride recording",NotificationManager.IMPORTANCE_LOW));
    }
    @Override public int onStartCommand(Intent intent,int flags,int id){
        if(intent!=null&&"STOP".equals(intent.getAction())){worker.post(()->finish("user_stopped"));return START_NOT_STICKY;}
        if(running||closing)return START_NOT_STICKY;
        placement=intent==null?"Unknown":intent.getStringExtra("placement");
        try{
            Intent open=new Intent(this,MainActivity.class);
            PendingIntent pi=PendingIntent.getActivity(this,0,open,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
            PendingIntent stop=PendingIntent.getService(this,1,new Intent(this,RideService.class).setAction("STOP"),PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
            Notification n=new Notification.Builder(this,"recording").setSmallIcon(android.R.drawable.ic_menu_mylocation).setContentTitle("Recording your commute").setContentText("GPS and motion stored on this phone. Tap Stop after parking.").setContentIntent(pi).setOngoing(true).addAction(new Notification.Action.Builder(null,"Stop & save",stop).build()).build();
            startForeground(1,n);
            running=true;liveStatus="Starting recorder…";worker.post(this::begin);
        }catch(Exception e){liveStatus="Cannot start. Check location permission and retry while app is visible.";running=false;stopSelf();}
        return START_NOT_STICKY;
    }
    private void begin(){
        try{
            startWall=System.currentTimeMillis();startElapsed=SystemClock.elapsedRealtime();lastFlush=startElapsed;
            String name=new SimpleDateFormat("yyyyMMdd-HHmmss-SSS",Locale.US).format(new Date(startWall));
            folder=new File(new File(getFilesDir(),"rides"),name);if(!folder.mkdirs())throw new IOException("Cannot create recording");
            gps=new BufferedWriter(new FileWriter(new File(folder,"gps.csv")));
            motion=new BufferedWriter(new FileWriter(new File(folder,"motion.csv")));
            gps.write("fix_epoch_ms,fix_elapsed_ns,latitude_deg,longitude_deg,accuracy_m,speed_mps,speed_accuracy_mps,bearing_deg,altitude_m,accepted,mock,age_seconds\n");
            motion.write("sensor_elapsed_ns,received_epoch_ms,type,x,y,z,w,heading_accuracy_rad,accuracy\n");
            JSONObject meta=new JSONObject().put("schema_version",2).put("placement",placement).put("device",Build.MANUFACTURER+" "+Build.MODEL).put("android_sdk",Build.VERSION.SDK_INT).put("started_epoch_ms",startWall).put("started_elapsed_ns",SystemClock.elapsedRealtimeNanos()).put("status","recording; summary.json indicates finalization").put("note","Raw phone motion in device axes. Acceleration m/s^2 includes gravity; gyro rad/s; pressure hPa in x only; rotation vector xyz plus optional w and heading accuracy in radians. Empty fields mean unavailable. Not calibrated road roughness or motorcycle lean.");
            JSONArray available=new JSONArray();
            for(int type:new int[]{Sensor.TYPE_ACCELEROMETER,Sensor.TYPE_GYROSCOPE,Sensor.TYPE_ROTATION_VECTOR,Sensor.TYPE_PRESSURE}){
                Sensor s=sensors.getDefaultSensor(type);if(s!=null){boolean registered=sensors.registerListener(this,s,40000,worker);available.put(new JSONObject().put("type",type).put("name",s.getName()).put("registered",registered));}
            }
            meta.put("sensors",available);writeJson("metadata.json",meta);
            if(!locations.isProviderEnabled(LocationManager.GPS_PROVIDER))throw new IOException("GPS disabled");
            if(checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION)!=android.content.pm.PackageManager.PERMISSION_GRANTED)throw new SecurityException("Precise location permission missing");
            locations.requestLocationUpdates(LocationManager.GPS_PROVIDER,1000,0,this,thread.getLooper());
            wake=((PowerManager)getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"RideLedger:recording");
            wake.acquire(4*60*60*1000L);
            liveStatus="Recording. Waiting for GPS outdoors. Motion samples stored locally.";
            worker.postDelayed(heartbeat,5000);
        }catch(Exception e){finish("setup_failed");liveStatus="Recording stopped: check GPS, permissions, and available storage. Any samples were retained.";}
    }
    private final Runnable heartbeat=new Runnable(){public void run(){if(!running||closing)return;try{flush();}catch(IOException e){finish("storage_error");return;}if(SystemClock.elapsedRealtime()-startElapsed>4*60*60*1000L){finish("four_hour_limit");return;}worker.postDelayed(this,5000);}};
    private void flush()throws IOException{if(gps!=null)gps.flush();if(motion!=null)motion.flush();lastFlush=SystemClock.elapsedRealtime();}
    @Override public void onLocationChanged(Location l){
        if(closing||gps==null)return;
        try{
            double age=(SystemClock.elapsedRealtimeNanos()-l.getElapsedRealtimeNanos())/1e9;
            boolean accept=GpsQuality.accepts(l.hasAccuracy(),l.getAccuracy(),age,l.isFromMockProvider(),l.getElapsedRealtimeNanos(),startElapsed*1000000L,previous==null?0:previous.getElapsedRealtimeNanos());
            if(accept&&previous!=null){double dt=(l.getElapsedRealtimeNanos()-previous.getElapsedRealtimeNanos())/1e9;double d=previous.distanceTo(l);distance+=GpsQuality.distanceContribution(dt,d,previous.getAccuracy(),l.getAccuracy());}
            if(accept)previous=new Location(l);else rejected++;
            gpsCount++;
            gps.write(String.format(Locale.US,"%d,%d,%.7f,%.7f,%.2f,%s,%s,%s,%s,%s,%s,%.3f%n",l.getTime(),l.getElapsedRealtimeNanos(),l.getLatitude(),l.getLongitude(),l.getAccuracy(),l.hasSpeed()?Float.toString(l.getSpeed()):"",l.hasSpeedAccuracy()?Float.toString(l.getSpeedAccuracyMetersPerSecond()):"",l.hasBearing()?Float.toString(l.getBearing()):"",l.hasAltitude()?Double.toString(l.getAltitude()):"",accept,l.isFromMockProvider(),age));
            liveStatus=String.format(Locale.US,"Recording · %.2f km estimated\n%d GPS fixes · %d motion samples\nGPS ±%.0f m · %s",distance/1000,gpsCount,sensorCount,l.getAccuracy(),accept?"fix accepted":"low-quality fix flagged");
        }catch(IOException e){finish("storage_error");}
    }
    @Override public void onSensorChanged(SensorEvent e){
        if(closing||motion==null)return;
        Long last=lastSample.get(e.sensor.getType());if(last!=null&&e.timestamp-last<40000000)return;lastSample.put(e.sensor.getType(),e.timestamp);
        try{
            StringBuilder row=new StringBuilder().append(e.timestamp).append(',').append(System.currentTimeMillis()).append(',').append(e.sensor.getType());
            for(int i=0;i<5;i++){row.append(',');if(i<e.values.length)row.append(Float.toString(e.values[i]));}
            motion.write(row.append(',').append(e.accuracy).append('\n').toString());sensorCount++;
        }catch(IOException ex){finish("storage_error");}
    }
    private void writeJson(String name,JSONObject obj)throws Exception{try(FileWriter f=new FileWriter(new File(folder,name))){f.write(obj.toString(2));}}
    private void finish(String reason){
        if(closing)return;closing=true;worker.removeCallbacks(heartbeat);
        sensors.unregisterListener(this);try{locations.removeUpdates(this);}catch(Exception ignored){}
        boolean saved=true;
        try{flush();}catch(Exception error){saved=false;}try{if(gps!=null)gps.close();}catch(Exception error){saved=false;}try{if(motion!=null)motion.close();}catch(Exception error){saved=false;}
        try{if(folder!=null)writeJson("summary.json",new JSONObject().put("schema_version",2).put("ended_epoch_ms",System.currentTimeMillis()).put("elapsed_seconds",(SystemClock.elapsedRealtime()-startElapsed)/1000).put("estimated_distance_m",Math.round(distance)).put("gps_samples",gpsCount).put("flagged_gps_samples",rejected).put("motion_samples",sensorCount).put("end_reason",saved?reason:"storage_error").put("placement",placement).put("note","Distance is a preliminary GPS estimate; jitter filtering may undercount. Pocket motion is not road-condition evidence."));else saved=false;}catch(Exception error){saved=false;}
        if(wake!=null&&wake.isHeld())wake.release();
        liveStatus=(saved?"Saved locally · ":"Storage error; retained files may be incomplete · ")+reason+"\n"+gpsCount+" GPS fixes, "+sensorCount+" motion samples. Export from Saved rides.";
        new Handler(getMainLooper()).post(()->{stopForeground(STOP_FOREGROUND_REMOVE);stopSelf();});
    }
    @Override public void onDestroy(){running=false;if(worker!=null){worker.post(()->{if(!closing)finish("service_destroyed");thread.quitSafely();});}super.onDestroy();}
    @Override public void onAccuracyChanged(Sensor sensor,int accuracy){}
    @Override public void onProviderDisabled(String provider){liveStatus="Recording motion; GPS disabled. Re-enable location to resume fixes.";}
    @Override public void onProviderEnabled(String provider){}
    @Override public void onStatusChanged(String provider,int status,Bundle extras){}
    @Override public IBinder onBind(Intent intent){return null;}
}
