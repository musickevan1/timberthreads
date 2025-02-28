'use client';

const About = () => {
  return (
    <section id="about" className="min-h-screen bg-stone-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-4">Welcome to Timber & Threads</h2>
          <div className="w-24 h-1 bg-teal-600 mx-auto"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-lg text-stone-700 leading-relaxed">
              Nestled on a peaceful island surrounded by a small lake in Clinton, Missouri, Timber & Threads Retreat 
              offers a unique quilting and crafting getaway. Our retreat center is designed to inspire creativity 
              while providing a serene escape from the busy world.
            </p>
            <p className="text-lg text-stone-700 leading-relaxed">
              Our all-on-one-level facility features comfortable accommodations, dedicated workspaces, and a 
              tranquil natural setting. Whether you're here for a quilting retreat, crafting weekend, or family 
              gathering, we provide an environment where creativity and relaxation flow naturally.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square rounded-lg overflow-hidden">
              <img 
                src="/assets/quilt-workspace.jpeg"
                alt="Quilting workspace"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square rounded-lg overflow-hidden mt-8">
              <img 
                src="/assets/quilt-display-1.jpeg"
                alt="Quilt display"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square rounded-lg overflow-hidden -mt-8">
              <img 
                src="/assets/quilt-display-2.jpeg"
                alt="Quilt display"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square rounded-lg overflow-hidden">
              <img 
                src="/assets/quilt-display-3.jpeg"
                alt="Quilt display"
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
