import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const galleryImages = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=600&fit=crop",
    title: "Morning Meditation Session",
    category: "Sessions",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop",
    title: "Peaceful Practice Space",
    category: "Facilities",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop",
    title: "Group Yoga Practice",
    category: "Sessions",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800&h=600&fit=crop",
    title: "Serene Environment",
    category: "Facilities",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1602192509154-0b900ee1f851?w=800&h=600&fit=crop",
    title: "Mindful Breathing",
    category: "Sessions",
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1512291313931-d4291048e7b6?w=800&h=600&fit=crop",
    title: "Nature Connection",
    category: "Environment",
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop",
    title: "Wellness Workshop",
    category: "Events",
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=800&h=600&fit=crop",
    title: "Sound Healing",
    category: "Sessions",
  },
  {
    id: 9,
    src: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&h=600&fit=crop",
    title: "Retreat Center",
    category: "Facilities",
  },
];

const categories = ["All", "Sessions", "Facilities", "Environment", "Events"];

export default function Gallery() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const filteredImages =
    selectedCategory === "All"
      ? galleryImages
      : galleryImages.filter((img) => img.category === selectedCategory);

  const currentImageIndex =
    selectedImage !== null
      ? filteredImages.findIndex((img) => img.id === selectedImage)
      : -1;

  const handlePrev = () => {
    if (currentImageIndex > 0) {
      setSelectedImage(filteredImages[currentImageIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentImageIndex < filteredImages.length - 1) {
      setSelectedImage(filteredImages[currentImageIndex + 1].id);
    }
  };

  const selectedImageData = galleryImages.find(
    (img) => img.id === selectedImage
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img
              src="/shadanga-kriya-logo.png"
              alt="Shadanga Kriya"
              className="h-10 w-auto cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Gallery</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">
            Our Journey in Images
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore moments of peace, practice, and transformation from our
            sessions and facilities.
          </p>
        </section>

        {/* Category Filter */}
        <section className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </section>

        {/* Gallery Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImages.map((image, index) => (
            <div
              key={image.id}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer shadow-soft hover:shadow-elevated transition-all duration-300"
              onClick={() => setSelectedImage(image.id)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <img
                src={image.src}
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white font-medium">{image.title}</p>
                <p className="text-white/70 text-sm">{image.category}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Lightbox */}
        <Dialog
          open={selectedImage !== null}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
            <DialogTitle className="sr-only">Image Preview</DialogTitle>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-5 w-5" />
              </Button>

              {currentImageIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              {currentImageIndex < filteredImages.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {selectedImageData && (
                <>
                  <img
                    src={selectedImageData.src}
                    alt={selectedImageData.title}
                    className="w-full h-auto max-h-[80vh] object-contain"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white font-medium text-lg">
                      {selectedImageData.title}
                    </p>
                    <p className="text-white/70">
                      {selectedImageData.category}
                    </p>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
