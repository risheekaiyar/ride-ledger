package app.rideledger;
import android.content.Context;
import android.webkit.*;
import android.net.Uri;
import java.io.*;
import java.util.*;
/** Offline app-owned assets for the chat overlay. All network requests use the narrow native transport. */
public final class CompanionAssets extends WebViewClient {
 private final Context context;
 public CompanionAssets(Context context){this.context=context;}
 @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return true;}
 @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
  Uri uri=request.getUrl();String path=uri.getPath();
  if(!"https".equals(uri.getScheme())||!"odo.local".equals(uri.getHost())||path==null||path.contains("..")||path.contains("\\"))return blocked();
  if(path.equals("/"))path="/index.html";
  try{String mime=path.endsWith(".js")?"text/javascript":path.endsWith(".css")?"text/css":path.endsWith(".svg")?"image/svg+xml":"text/html";WebResourceResponse response=new WebResourceResponse(mime,"UTF-8",context.getAssets().open("odo"+path));response.setResponseHeaders(Collections.singletonMap("Content-Security-Policy","default-src 'self'; script-src 'self' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'none'"));return response;}catch(IOException e){return blocked();}
 }
 private WebResourceResponse blocked(){return new WebResourceResponse("text/plain","UTF-8",403,"Blocked",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
}
