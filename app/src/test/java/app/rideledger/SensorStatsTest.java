package app.rideledger;
import org.junit.Test;
import static org.junit.Assert.*;
public class SensorStatsTest {
    @Test public void vectorMagnitudeRmsAndTiming(){
        SensorStats s=new SensorStats();s.add(1000000000L,new float[]{3,4,0});s.add(3000000000L,new float[]{0,0,0});
        assertEquals(2,s.count);assertEquals(2.5,s.mean(),1e-8);assertEquals(Math.sqrt(12.5),s.rms(),1e-8);
        assertEquals(5,s.peak,0);assertEquals(.5,s.hz(),0);assertEquals(2,s.maxGapSeconds,0);assertEquals(1,s.gapsOverOneSecond);
    }
    @Test public void invalidAndDuplicateSamplesIgnored(){
        SensorStats s=new SensorStats();s.add(1,new float[]{Float.NaN});s.add(1,new float[]{});
        s.add(1,new float[]{9.8f});s.add(1,new float[]{20});s.add(0,new float[]{20});
        assertEquals(1,s.count);assertEquals(9.8,s.mean(),1e-5);assertEquals(0,s.hz(),0);
    }
    @Test public void emptyStatsAreFinite(){SensorStats s=new SensorStats();assertEquals(0,s.mean(),0);assertEquals(0,s.rms(),0);assertEquals(0,s.hz(),0);}
}
