package app.rideledger;

/** Conservative preview filter. Raw fixes are always retained separately. */
final class GpsQuality {
    static boolean accepts(boolean hasAccuracy, float accuracy, double ageSeconds,
                           boolean mock, long fixNs, long startNs, long previousNs) {
        return hasAccuracy && Float.isFinite(accuracy) && accuracy >= 0 && accuracy <= 30
                && Double.isFinite(ageSeconds) && ageSeconds >= 0 && ageSeconds <= 15
                && !mock && fixNs >= startNs && fixNs > previousNs;
    }

    static double distanceContribution(double seconds, double meters, float oldAccuracy, float accuracy) {
        if (!Double.isFinite(seconds) || !Double.isFinite(meters) || seconds <= 0
                || seconds > 15 || meters < 0 || meters / seconds >= 70) return 0;
        return meters > Math.max(3, Math.min(oldAccuracy, accuracy) / 2) ? meters : 0;
    }
}
