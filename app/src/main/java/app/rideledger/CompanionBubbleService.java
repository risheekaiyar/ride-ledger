package app.rideledger;

import android.app.*;
import android.content.*;
import android.graphics.PixelFormat;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.widget.*;

/** Explicit opt-in overlay shortcut. No location, microphone or credentials are read. */
public class CompanionBubbleService extends Service {
    private WindowManager manager;
    private TextView bubble;
    @Override public void onCreate() {
        super.onCreate();
        if (!Settings.canDrawOverlays(this)) { stopSelf(); return; }
        NotificationManager notifications=getSystemService(NotificationManager.class);
        notifications.createNotificationChannel(new NotificationChannel("odo_companion","Odo companion",NotificationManager.IMPORTANCE_LOW));
        Intent stop=new Intent(this,CompanionBubbleService.class).setAction("STOP");
        PendingIntent dismiss=PendingIntent.getService(this,1,stop,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        Notification notification=new Notification.Builder(this,"odo_companion").setSmallIcon(app.rideledger.R.drawable.ic_ride).setContentTitle("Odo companion bubble").setContentText("Tap the bubble to open Odo. Hold it to dismiss.").addAction(new Notification.Action.Builder(null,"Dismiss",dismiss).build()).build();
        startForeground(24,notification);
        manager=getSystemService(WindowManager.class);
        bubble=new TextView(this);bubble.setText("✦ Odo");bubble.setTextColor(0xff17151a);bubble.setTextSize(16);bubble.setGravity(Gravity.CENTER);bubble.setPadding(20,16,20,16);bubble.setContentDescription("Open Odo companion; hold to dismiss");
        android.graphics.drawable.GradientDrawable bg=new android.graphics.drawable.GradientDrawable();bg.setColor(0xfff1e8d8);bg.setCornerRadius(70);bubble.setBackground(bg);
        WindowManager.LayoutParams layout=new WindowManager.LayoutParams(-2,-2,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,PixelFormat.TRANSLUCENT);layout.gravity=Gravity.TOP|Gravity.END;layout.x=16;layout.y=200;
        bubble.setOnClickListener(v->startActivity(new Intent(this,DashboardActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("companion",true)));
        bubble.setOnLongClickListener(v->{stopSelf();return true;});
        try { manager.addView(bubble,layout); } catch(RuntimeException e) { stopSelf(); }
    }
    @Override public int onStartCommand(Intent intent,int flags,int id){if(intent!=null&&"STOP".equals(intent.getAction()))stopSelf();return START_NOT_STICKY;}
    @Override public IBinder onBind(Intent intent){return null;}
    @Override public void onDestroy(){if(manager!=null&&bubble!=null&&bubble.isAttachedToWindow())manager.removeView(bubble);stopForeground(true);super.onDestroy();}
}
