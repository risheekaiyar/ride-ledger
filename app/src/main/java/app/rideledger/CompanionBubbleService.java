package app.rideledger;

import android.app.*;
import android.content.*;
import android.graphics.PixelFormat;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import java.util.concurrent.*;
import org.json.*;

/** Opt-in draggable companion overlay. Credentials stay in the native HTTPS transport. */
public class CompanionBubbleService extends Service {
 private WindowManager manager;
 private LinearLayout root;
 private WebView web;
 private WindowManager.LayoutParams layout;
 private CompanionClient client;
 private final Handler main=new Handler(Looper.getMainLooper());
 private final ExecutorService io=Executors.newSingleThreadExecutor();
 private boolean expanded=false,destroyed=false;
 private int x=16,y=200;
 @Override public void onCreate(){
  super.onCreate();if(!Settings.canDrawOverlays(this)){stopSelf();return;}
  client=new CompanionClient(this);manager=getSystemService(WindowManager.class);
  NotificationManager notifications=getSystemService(NotificationManager.class);
  notifications.createNotificationChannel(new NotificationChannel("odo_companion","Odo companion",NotificationManager.IMPORTANCE_LOW));
  PendingIntent dismiss=PendingIntent.getService(this,1,new Intent(this,CompanionBubbleService.class).setAction("STOP"),PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
  startForeground(24,new Notification.Builder(this,"odo_companion").setSmallIcon(R.drawable.ic_ride).setContentTitle("Odo companion").setContentText("Open the bubble to chat after parking. Dismiss here at any time.").addAction(new Notification.Action.Builder(null,"Dismiss",dismiss).build()).build());
  root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(0xff1b1b20);
  layout=new WindowManager.LayoutParams(-2,-2,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,PixelFormat.TRANSLUCENT);layout.gravity=Gravity.TOP|Gravity.LEFT;layout.x=x;layout.y=y;
  try{manager.addView(root,layout);collapse();}catch(RuntimeException e){stopSelf();}
  main.postDelayed(permissionCheck,1000);
 }
 private final Runnable permissionCheck=new Runnable(){public void run(){if(destroyed)return;if(!Settings.canDrawOverlays(CompanionBubbleService.this)){stopSelf();return;}main.postDelayed(this,1000);}};
 private Button button(String label,String description,Runnable action){Button b=new Button(this);b.setText(label);b.setContentDescription(description);b.setTextSize(12);b.setMinWidth(0);b.setMinimumWidth(0);b.setTextColor(0xfff1e8d8);b.setOnClickListener(v->action.run());return b;}
 private void update(){try{if(root.isAttachedToWindow())manager.updateViewLayout(root,layout);}catch(RuntimeException e){stopSelf();}}
 private void drag(View view,Runnable tap){
  view.setOnTouchListener(new View.OnTouchListener(){float sx,sy;int ox,oy;boolean moved;
   public boolean onTouch(View v,android.view.MotionEvent e){switch(e.getActionMasked()){
    case android.view.MotionEvent.ACTION_DOWN:sx=e.getRawX();sy=e.getRawY();ox=layout.x;oy=layout.y;moved=false;return true;
    case android.view.MotionEvent.ACTION_MOVE:float dx=e.getRawX()-sx,dy=e.getRawY()-sy;if(Math.abs(dx)+Math.abs(dy)>12)moved=true;if(moved){layout.x=Math.max(0,Math.min(getResources().getDisplayMetrics().widthPixels-root.getWidth(),ox+(int)dx));layout.y=Math.max(0,Math.min(getResources().getDisplayMetrics().heightPixels-root.getHeight(),oy+(int)dy));x=layout.x;y=layout.y;update();}return true;
    case android.view.MotionEvent.ACTION_UP:if(!moved)v.performClick();return true;
    default:return true;
   }}
  });view.setOnClickListener(v->tap.run());
 }
 private void collapse(){
  expanded=false;destroyWeb();root.removeAllViews();layout.width=-2;layout.height=-2;layout.flags=WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;layout.x=x;layout.y=y;
  Button bubble=button("✦ Odo","Open Odo companion. Drag to reposition.",this::expand);bubble.setOnLongClickListener(v->{stopSelf();return true;});drag(bubble,this::expand);root.addView(bubble);update();
 }
 private void expand(){
  if(expanded||destroyed)return;expanded=true;root.removeAllViews();
  float density=getResources().getDisplayMetrics().density;layout.width=Math.min(getResources().getDisplayMetrics().widthPixels-24,(int)(400*density));layout.height=Math.min((int)(getResources().getDisplayMetrics().heightPixels*.78),(int)(650*density));layout.x=12;layout.y=30;layout.flags=WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL;layout.softInputMode=WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;
  LinearLayout bar=new LinearLayout(this);Button handle=button("✦ Odo","Move companion window",()->{});drag(handle,()->{});bar.addView(handle,new LinearLayout.LayoutParams(0,-2,1));bar.addView(button("App","Open the full Odo app",()->{collapse();startActivity(new Intent(this,DashboardActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP));}));bar.addView(button("−","Collapse companion",this::collapse));bar.addView(button("×","Dismiss companion",this::stopSelf));root.addView(bar);
  web=new WebView(this);web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);web.setWebViewClient(new CompanionAssets(this));web.addJavascriptInterface(new Transport(),"OdoNativeCompanion");root.addView(web,new LinearLayout.LayoutParams(-1,0,1));web.loadUrl("https://odo.local/#companion-overlay");update();
 }
 public final class Transport {
  @JavascriptInterface public void configure(){main.post(()->{collapse();startActivity(new Intent(CompanionBubbleService.this,DashboardActivity.class).setAction("CONFIGURE_COMPANION").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP));});}
  @JavascriptInterface public void request(String id,String method,String body){
   if(!id.matches("[0-9]{1,12}")||body==null||body.length()>12000||!(method.equals("GET")||method.equals("POST")))return;
   final WebView target=web;
   io.execute(()->{JSONObject result=client.request(method,body);main.post(()->{if(!destroyed&&web==target&&target!=null)target.evaluateJavascript("window.odoCompanionReply&&window.odoCompanionReply("+JSONObject.quote(id)+","+result+")",null);});});
  }
 }
 private void destroyWeb(){if(web!=null){web.removeJavascriptInterface("OdoNativeCompanion");web.stopLoading();web.destroy();web=null;}}
 @Override public int onStartCommand(Intent intent,int flags,int id){if(intent!=null&&"STOP".equals(intent.getAction()))stopSelf();return START_NOT_STICKY;}
 @Override public android.os.IBinder onBind(Intent intent){return null;}
 @Override public void onDestroy(){destroyed=true;main.removeCallbacksAndMessages(null);destroyWeb();io.shutdownNow();if(manager!=null&&root!=null&&root.isAttachedToWindow())manager.removeView(root);stopForeground(true);super.onDestroy();}
}
