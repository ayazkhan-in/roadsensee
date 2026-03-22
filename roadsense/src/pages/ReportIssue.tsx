import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, MapPin, Mic, Construction, Lightbulb, AlertTriangle, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import ChatbotWidget from "@/components/ChatbotWidget";
import { api } from "@/lib/api";
import { reverseGeocode } from "@/lib/location";
import MapLibreCanvas from "@/components/maps/MapLibreCanvas";

const categories = [
  { icon: Construction, label: "Pothole", active: true },
  { icon: Lightbulb, label: "Street Light", active: false },
  { icon: AlertTriangle, label: "Obstruction", active: false },
  { icon: Grid3X3, label: "Other", active: false },
];

const ReportIssue = () => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Detecting current location...");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLabel("Geolocation not supported in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setCoords({ lat, lng });
        setAccuracy(Math.round(position.coords.accuracy));

        const placeName = await reverseGeocode(lat, lng);
        setLocationLabel(placeName || `Lat ${lat}, Lng ${lng}`);
      },
      () => {
        setCoords({ lat: 17.6599, lng: 75.9064 });
        setLocationLabel("Location permission denied, using Solapur default");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fallbackCoords = coords || { lat: 17.6599, lng: 75.9064 };

      setCheckingDuplicate(true);
      const duplicate = await api.detectDuplicate({
        lat: fallbackCoords.lat,
        lng: fallbackCoords.lng,
        type: categories[selectedCategory].label,
      });
      setCheckingDuplicate(false);

      if (duplicate.duplicate && duplicate.matches.length > 0) {
        const proceed = window.confirm(
          `A similar complaint already exists nearby (${duplicate.matches[0].complaintId}). Do you still want to submit a new report?`
        );
        if (!proceed) {
          return;
        }
      }

      const complaint = await api.createComplaint({
        type: categories[selectedCategory].label,
        description,
        location: locationLabel,
        lat: fallbackCoords.lat,
        lng: fallbackCoords.lng,
        severity: selectedCategory === 0 ? "HIGH" : "MEDIUM",
        imageUrl: uploadedImageUrl,
      });

      navigate(`/ai-result?complaintId=${complaint.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to submit complaint");
    } finally {
      setCheckingDuplicate(false);
      setSubmitting(false);
    }
  };
  const openFilePicker = () => fileInputRef.current?.click();
  const handleAdjustPin = () => navigate("/map");

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const localPreview = URL.createObjectURL(file);
    setImagePreviewUrl(localPreview);

    setUploadingImage(true);
    try {
      const upload = await api.uploadComplaintImage(file);
      setUploadedImageUrl(upload.imageUrl);
      setImagePreviewUrl(upload.imageUrl);
    } catch (error) {
      setUploadedImageUrl("");
      alert(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Speech recognition is not supported in this browser");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognitionRef.current = recognition;
    }

    if (listening) {
      recognitionRef.current.stop();
      return;
    }

    recognitionRef.current.start();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10 animate-fade-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">Report a Road Issue</h1>
          <p className="text-muted-foreground">Identify hazards and help us maintain the city infrastructure safely.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6 animate-fade-up" style={{ animationDelay: "100ms" }}>
            {/* Image Upload */}
            <div className="surface-card p-8 text-center">
              {imagePreviewUrl ? (
                <img
                  src={imagePreviewUrl}
                  alt="Selected complaint"
                  className="w-full h-48 object-cover rounded-xl border border-border mb-4"
                />
              ) : (
                <div className="h-16 w-16 bg-teal-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-7 w-7 text-teal" />
                </div>
              )}
              <h3 className="font-semibold text-foreground mb-1">Capture or Upload Image</h3>
              <p className="text-sm text-muted-foreground mb-5">Take a clear photo of the pothole, debris, or damaged sign for faster processing.</p>
              <div className="flex justify-center gap-3">
                <Button className="gap-2" onClick={openFilePicker}>
                  <Camera className="h-4 w-4" /> Use Camera
                </Button>
                <Button variant="outline" className="gap-2" onClick={openFilePicker}>
                  <Upload className="h-4 w-4" /> Browse Gallery
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelected}
                />
              </div>
              {uploadingImage ? <p className="text-xs text-muted-foreground mt-3">Uploading image...</p> : null}
            </div>

            {/* Description */}
            <div className="surface-card p-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-foreground">Describe the situation (Optional)</h3>
                <button onClick={handleVoiceInput} className="text-muted-foreground hover:text-foreground">
                  <Mic className={`h-5 w-5 ${listening ? "text-teal" : ""}`} />
                </button>
              </div>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the hazard severity or specific location notes..."
                className="w-full bg-secondary rounded-lg px-4 py-3 text-sm outline-none resize-none border border-transparent focus:border-ring transition-colors placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6 animate-fade-up" style={{ animationDelay: "200ms" }}>
            {/* Location */}
            <div className="surface-card overflow-hidden">
              <div className="h-1.5 bg-teal w-full" />
              <div className="p-6">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-semibold text-foreground">Auto-Location Detected</h3>
                    <p className="text-sm font-semibold text-teal uppercase">
                      {accuracy ? `High Accuracy (${accuracy}m)` : "Locating..."}
                    </p>
                  </div>
                  <MapPin className="h-5 w-5 text-teal" />
                </div>
                <div className="bg-teal/10 rounded-xl h-44 overflow-hidden my-4 relative">
                  <MapLibreCanvas
                    center={coords ? [coords.lng, coords.lat] : [75.9064, 17.6599]}
                    zoom={14}
                    markers={
                      coords
                        ? [
                            {
                              coordinates: [coords.lng, coords.lat],
                              color: "#dc2626",
                              label: "Detected location",
                            },
                          ]
                        : []
                    }
                  />
                  <button onClick={handleAdjustPin} className="absolute bottom-3 right-3 bg-card text-xs font-medium px-3 py-1.5 rounded-md shadow-sm border border-border">
                    Adjust Pin
                  </button>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {locationLabel}
                </p>
              </div>
            </div>

            {/* Category */}
            <div className="surface-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Issue Category</h3>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat, i) => (
                  <button
                    key={cat.label}
                    onClick={() => setSelectedCategory(i)}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all active:scale-95 ${
                      selectedCategory === i
                        ? "border-foreground bg-secondary shadow-sm"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <cat.icon className={`h-5 w-5 ${selectedCategory === i ? "text-foreground" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${selectedCategory === i ? "text-foreground" : "text-muted-foreground"}`}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <Button className="w-full font-semibold" size="lg" onClick={handleSubmit} disabled={checkingDuplicate || submitting}>
              {checkingDuplicate ? "Checking duplicates..." : submitting ? "Submitting..." : "Submit Urgent Report"}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
              By submitting, you agree to provide accurate location data for city services.
            </p>
          </div>
        </div>
      </div>

      <ChatbotWidget />
    </div>
  );
};

export default ReportIssue;
