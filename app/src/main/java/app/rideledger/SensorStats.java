package app.rideledger;

/** Streaming magnitude and timing diagnostics; no activity classification. */
final class SensorStats {
    long count, firstNs, lastNs, gapsOverOneSecond;
    double sum, sumSquares, peak, maxGapSeconds;
    void add(long time, float[] values) {
        double square=0;
        for(int i=0;i<Math.min(3,values.length);i++) {
            if(!Float.isFinite(values[i]))return;
            square+=(double)values[i]*values[i];
        }
        if(values.length==0|| (count>0&&time<=lastNs))return;
        if(count==0)firstNs=time;
        else { double gap=(time-lastNs)/1e9;maxGapSeconds=Math.max(maxGapSeconds,gap);if(gap>1)gapsOverOneSecond++; }
        lastNs=time;count++;double magnitude=Math.sqrt(square);
        sum+=magnitude;sumSquares+=square;peak=Math.max(peak,magnitude);
    }
    double mean(){return count==0?0:sum/count;}
    double rms(){return count==0?0:Math.sqrt(sumSquares/count);}
    double hz(){return lastNs>firstNs?(count-1)*1e9/(lastNs-firstNs):0;}
}
