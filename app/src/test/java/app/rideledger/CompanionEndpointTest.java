package app.rideledger;
import org.junit.Test;
import static org.junit.Assert.*;
public class CompanionEndpointTest {
 @Test public void acceptsHttpsAuthority(){assertEquals("https://example.com:8443",CompanionEndpoint.validate("https://example.com:8443/"));}
 @Test public void rejectsCredentialBearingOrAmbiguousUrls(){for(String value:new String[]{"http://example.com","https://secret@example.com","https://example.com/path","https://example.com?token=secret","https://example.com#secret","https://example.com:99999","https:///missing"}){try{CompanionEndpoint.validate(value);fail(value);}catch(IllegalArgumentException expected){}}}
}
