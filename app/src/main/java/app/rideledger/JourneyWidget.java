package app.rideledger;
import android.app.*;
import android.appwidget.*;
import android.content.*;
import android.widget.RemoteViews;

/** Launches a visible Activity before starting a location FGS; no overlay permission. */
public class JourneyWidget extends AppWidgetProvider {
    @Override public void onUpdate(Context c,AppWidgetManager manager,int[] ids){for(int id:ids)update(c,manager,id);}
    private static void update(Context c,AppWidgetManager manager,int id){
        RemoteViews views=new RemoteViews(c.getPackageName(),R.layout.journey_widget);
        views.setTextViewText(R.id.widget_action,RideService.running?"■  Stop & save":"●  Start journey");
        Intent intent=new Intent(c,DashboardActivity.class).setAction("WIDGET_TOGGLE").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        views.setOnClickPendingIntent(R.id.widget_root,PendingIntent.getActivity(c,44,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));manager.updateAppWidget(id,views);
    }
    static void refresh(Context c){AppWidgetManager m=AppWidgetManager.getInstance(c);for(int id:m.getAppWidgetIds(new ComponentName(c,JourneyWidget.class)))update(c,m,id);}
}
