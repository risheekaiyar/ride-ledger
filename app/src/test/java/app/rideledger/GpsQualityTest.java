package app.rideledger;

import org.junit.Test;
import static org.junit.Assert.*;

public class GpsQualityTest {
    private boolean fix(float accuracy, double age, boolean mock, long time) {
        return GpsQuality.accepts(true, accuracy, age, mock, time, 100, 110);
    }
    @Test public void goodFixAccepted() { assertTrue(fix(10, 1, false, 120)); }
    @Test public void approximateAndMissingAccuracyRejected() {
        assertFalse(fix(100, 1, false, 120));
        assertFalse(GpsQuality.accepts(false, 0, 1, false, 120, 100, 110));
    }
    @Test public void staleFutureMockAndOldFixRejected() {
        assertFalse(fix(10, 16, false, 120));
        assertFalse(fix(10, -1, false, 120));
        assertFalse(fix(10, 1, true, 120));
        assertFalse(fix(10, 1, false, 99));
        assertFalse(fix(10, 1, false, 110));
    }
    @Test public void invalidNumbersRejected() {
        assertFalse(fix(Float.NaN, 1, false, 120));
        assertFalse(fix(-1, 1, false, 120));
        assertFalse(fix(10, Double.NaN, false, 120));
        assertEquals(0, GpsQuality.distanceContribution(1, Double.NaN, 5, 5), 0);
    }
    @Test public void normalSegmentCounted() { assertEquals(10, GpsQuality.distanceContribution(1, 10, 5, 5), 0); }
    @Test public void jitterGapsAndJumpsDoNotInflateDistance() {
        assertEquals(0, GpsQuality.distanceContribution(1, 2, 5, 5), 0);
        assertEquals(0, GpsQuality.distanceContribution(20, 100, 5, 5), 0);
        assertEquals(0, GpsQuality.distanceContribution(1, 100, 5, 5), 0);
        assertEquals(0, GpsQuality.distanceContribution(0, 10, 5, 5), 0);
    }
}
