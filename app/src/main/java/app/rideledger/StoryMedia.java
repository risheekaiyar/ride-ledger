package app.rideledger;

/** Narrow local media types accepted by the read-only story share provider. */
final class StoryMedia {
    static final int MAX_VIDEO_BYTES=12*1024*1024;
    private StoryMedia(){}
    static boolean validName(String name){return name!=null&&name.matches("odo-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.(png|mp4|webm)");}
    static String mime(String name){if(!validName(name))return null;return name.endsWith(".png")?"image/png":name.endsWith(".mp4")?"video/mp4":"video/webm";}
    static String videoExtension(String data){
        if(data==null||data.length()>(MAX_VIDEO_BYTES*4/3)+128)return null;
        if(data.startsWith("data:video/mp4;base64,"))return "mp4";
        if(data.startsWith("data:video/webm;base64,"))return "webm";
        return null;
    }
    static boolean videoHeader(byte[] bytes,String extension){
        if(bytes==null||bytes.length<12||bytes.length>MAX_VIDEO_BYTES)return false;
        if("mp4".equals(extension))return bytes[4]=='f'&&bytes[5]=='t'&&bytes[6]=='y'&&bytes[7]=='p';
        return "webm".equals(extension)&&(bytes[0]&255)==0x1a&&(bytes[1]&255)==0x45&&(bytes[2]&255)==0xdf&&(bytes[3]&255)==0xa3;
    }
    static boolean videoBounds(String width,String height,String duration){
        try{int w=Integer.parseInt(width),h=Integer.parseInt(height);long ms=Long.parseLong(duration);return w>0&&w<=1280&&h>0&&h<=1920&&ms>=1000&&ms<=30000;}catch(RuntimeException e){return false;}
    }
}
