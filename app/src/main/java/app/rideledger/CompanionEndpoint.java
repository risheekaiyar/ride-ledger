package app.rideledger;
import java.net.URI;
/** Keep credentials out of URLs and disallow redirects to another authority. */
public final class CompanionEndpoint {
    private CompanionEndpoint() {}
    public static String validate(String value) {
        try {
            URI uri=new URI(value.trim());
            if(!"https".equalsIgnoreCase(uri.getScheme())||uri.getHost()==null||uri.getRawUserInfo()!=null||uri.getRawQuery()!=null||uri.getRawFragment()!=null||uri.getPort()==0||uri.getPort()>65535||!(uri.getRawPath()==null||uri.getRawPath().isEmpty()||uri.getRawPath().equals("/")))throw new IllegalArgumentException();
            return "https://"+uri.getRawAuthority();
        } catch(Exception e) { throw new IllegalArgumentException("Use an HTTPS server address without credentials, a path, query or fragment."); }
    }
}
