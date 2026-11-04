package app.rideledger;

import org.junit.Test;
import static org.junit.Assert.*;

public class StoryMediaTest {
    private final String id="odo-12345678-1234-1234-1234-123456789abc";
    @Test public void onlyScopedMediaNamesReceiveTypes(){
        assertEquals("image/png",StoryMedia.mime(id+".png"));assertEquals("video/mp4",StoryMedia.mime(id+".mp4"));assertEquals("video/webm",StoryMedia.mime(id+".webm"));
        for(String name:new String[]{null,"../"+id+".mp4",id+".zip",id+".mp4/extra",id+".MP4","odo-------------------------------------.png"})assertNull(StoryMedia.mime(name));
    }
    @Test public void mediaHeadersMustMatchTheDeclaredContainer(){
        byte[] mp4=new byte[20];mp4[4]='f';mp4[5]='t';mp4[6]='y';mp4[7]='p';assertTrue(StoryMedia.videoHeader(mp4,"mp4"));assertFalse(StoryMedia.videoHeader(mp4,"webm"));
        byte[] webm=new byte[20];webm[0]=0x1a;webm[1]=0x45;webm[2]=(byte)0xdf;webm[3]=(byte)0xa3;assertTrue(StoryMedia.videoHeader(webm,"webm"));assertFalse(StoryMedia.videoHeader(webm,"mp4"));assertFalse(StoryMedia.videoHeader(new byte[4],"webm"));
    }
    @Test public void clipTransportAndDecodedDimensionsAreBounded(){
        assertEquals("mp4",StoryMedia.videoExtension("data:video/mp4;base64,AAA="));assertEquals("webm",StoryMedia.videoExtension("data:video/webm;base64,AAA="));assertNull(StoryMedia.videoExtension("data:text/html;base64,AAA="));assertNull(StoryMedia.videoExtension("data:video/mp4;charset=UTF-8;base64,AAA="));
        assertTrue(StoryMedia.videoBounds("720","1280","12100"));assertFalse(StoryMedia.videoBounds("720","1280","31000"));assertFalse(StoryMedia.videoBounds("720","1280","999"));assertFalse(StoryMedia.videoBounds("9999","1280","12000"));assertFalse(StoryMedia.videoBounds("720",null,"12000"));assertFalse(StoryMedia.videoBounds("0","1280","12000"));
    }
}
