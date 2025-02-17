'use client';

const About = () => {
  return (
    <section id="about" className="min-h-screen bg-stone-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-4">Welcome to Our Sanctuary</h2>
          <div className="w-24 h-1 bg-teal-600 mx-auto"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-lg text-stone-700 leading-relaxed">
              Nestled in the heart of nature, Timber & Threads Retreat offers a unique blend of crafting workshops 
              and peaceful accommodation. Our space is designed to inspire creativity while providing a serene escape 
              from the busy world.
            </p>
            <p className="text-lg text-stone-700 leading-relaxed">
              Whether you're here to master the art of weaving, explore woodworking, or simply find solace in our 
              tranquil surroundings, we provide an environment where creativity and relaxation flow naturally.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square rounded-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1544967082-d9d25d867d66?q=80&w=800&auto=format&fit=crop"
                alt="Quilting workshop"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square rounded-lg overflow-hidden mt-8">
              <img 
                src="https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=800&auto=format&fit=crop"
                alt="Handcrafted textiles"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square rounded-lg overflow-hidden -mt-8">
              <img 
                src="https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?q=80&w=800&auto=format&fit=crop"
                alt="Craft materials"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square rounded-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1612344441107-ef12287e4872?q=80&w=800&auto=format&fit=crop"
                alt="Weaving loom"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
