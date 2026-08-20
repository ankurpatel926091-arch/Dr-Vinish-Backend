import Blog from '../models/Blog.js';

// Seed initial blogs data if empty
export const initialBlogsData = [
  {
    title: 'Expert Urological Consultation: What to Expect During Your First Visit',
    slug: 'expert-urological-consultation',
    category: 'DOCTOR CONSULTATION',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=800',
    shortDescription: 'Comprehensive guidance on initial urological evaluation, detailed medical history review, diagnostic planning, and personalized treatment strategy.',
    content: 'A specialized urological consultation is designed to thoroughly evaluate urinary tract health in men and women, as well as male reproductive wellness. Dr. Vinish Kumar Singh prioritizes patient comfort, clear communication, and precise diagnostics to formulate effective, evidence-based treatment plans tailored to each individual.\n\nKey steps include detailed medical history review, symptom assessment, physical examination, non-invasive diagnostic planning, and treatment discussions.',
    publishDate: '2025-05-28',
    readTime: '6 min read',
    status: 'Published',
    featured: true,
    author: 'Dr. Vinish Kumar Singh',
    authorRole: 'Senior Consultant Urologist & Laser Surgeon'
  },
  {
    title: 'Female Urological Health: Understanding UTIs, Bladder Care & Modern Treatments',
    slug: 'female-urological-health-utis-bladder-care',
    category: 'FEMALE UROLOGY & CARE',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800',
    shortDescription: 'Expert advice on managing recurrent urinary tract infections, overactive bladder symptoms, pelvic floor wellness, and evidence-based non-invasive treatments.',
    content: 'Due to female anatomy, women are particularly susceptible to recurrent urinary tract infections (UTIs), overactive bladder (OAB), urinary stress incontinence, and pelvic organ prolapse. Dr. Vinish Kumar Singh offers compassionate, specialized care for women suffering from chronic bladder discomfort.',
    publishDate: '2025-04-14',
    readTime: '5 min read',
    status: 'Published',
    featured: false,
    author: 'Dr. Vinish Kumar Singh',
    authorRole: 'Senior Consultant Urologist & Laser Surgeon'
  },
  {
    title: 'Preventing Kidney Stones: 5 Proven Tips from a Urologist',
    slug: 'preventing-kidney-stones-5-proven-tips',
    category: 'KIDNEY HEALTH',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800',
    shortDescription: 'Essential dietary adjustments, hydration protocols, and lifestyle changes to prevent kidney stone formation.',
    content: 'Kidney stones can cause severe flank pain. Hydration is the single most important factor in preventing stone recurrence. Drinking at least 2.5 to 3 liters of water daily helps flush out stone-forming minerals before they crystallize.',
    publishDate: '2025-05-10',
    readTime: '5 min read',
    status: 'Published',
    featured: true,
    author: 'Dr. Vinish Kumar Singh',
    authorRole: 'Senior Consultant Urologist & Laser Surgeon'
  }
];

export const seedBlogsIfEmpty = async () => {
  try {
    const count = await Blog.countDocuments();
    if (count === 0) {
      await Blog.insertMany(initialBlogsData);
      console.log('Seed: Initial default blogs created successfully.');
    }
  } catch (error) {
    console.error('Error seeding blogs:', error.message);
  }
};

// @desc    Get all published blogs (Public)
// @route   GET /api/blogs/public or GET /api/blogs
export const getPublicBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'Published' }).sort({ createdAt: -1 });
    res.json({ success: true, count: blogs.length, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single blog by slug or ID (Public)
// @route   GET /api/blogs/:slugOrId
export const getBlogBySlugOrId = async (req, res) => {
  try {
    const { slugOrId } = req.params;
    let blog = await Blog.findOne({ slug: slugOrId.toLowerCase() });
    
    if (!blog && slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(slugOrId);
    }

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all blogs including drafts (Admin)
// @route   GET /api/blogs/admin/all or GET /api/blogs/admin
export const getAdminBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: blogs.length, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new blog (Admin)
// @route   POST /api/blogs/admin or POST /api/blogs
export const createBlog = async (req, res) => {
  try {
    const {
      title,
      slug,
      category,
      image,
      shortDescription,
      content,
      publishDate,
      readTime,
      status,
      featured,
      author,
      authorRole
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required fields' });
    }

    // Auto-generate slug if not provided
    const blogSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Check slug uniqueness
    const existingBlog = await Blog.findOne({ slug: blogSlug });
    let finalSlug = blogSlug;
    if (existingBlog) {
      finalSlug = `${blogSlug}-${Date.now().toString().slice(-4)}`;
    }

    const newBlog = await Blog.create({
      title,
      slug: finalSlug,
      category: category || 'General Urology',
      image: image || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800',
      shortDescription: shortDescription || '',
      content,
      publishDate: publishDate || new Date().toISOString().split('T')[0],
      readTime: readTime || '5 min read',
      status: status || 'Published',
      featured: Boolean(featured),
      author: author || 'Dr. Vinish Kumar Singh',
      authorRole: authorRole || 'Senior Consultant Urologist & Laser Surgeon'
    });

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: newBlog
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update existing blog (Admin)
// @route   PUT /api/blogs/admin/:id or PUT /api/blogs/:id
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const {
      title,
      slug,
      category,
      image,
      shortDescription,
      content,
      publishDate,
      readTime,
      status,
      featured,
      author,
      authorRole
    } = req.body;

    if (title) blog.title = title;
    if (slug) {
      blog.slug = slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }
    if (category !== undefined) blog.category = category;
    if (image !== undefined) blog.image = image;
    if (shortDescription !== undefined) blog.shortDescription = shortDescription;
    if (content !== undefined) blog.content = content;
    if (publishDate !== undefined) blog.publishDate = publishDate;
    if (readTime !== undefined) blog.readTime = readTime;
    if (status !== undefined) blog.status = status;
    if (featured !== undefined) blog.featured = Boolean(featured);
    if (author !== undefined) blog.author = author;
    if (authorRole !== undefined) blog.authorRole = authorRole;

    const updatedBlog = await blog.save();

    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete blog (Admin)
// @route   DELETE /api/blogs/admin/:id or DELETE /api/blogs/:id
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    await Blog.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle blog status (Draft <-> Published) (Admin)
// @route   PATCH /api/blogs/admin/:id/status or PATCH /api/blogs/:id/status
export const toggleBlogStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    blog.status = blog.status === 'Published' ? 'Draft' : 'Published';
    const updatedBlog = await blog.save();

    res.json({
      success: true,
      message: `Blog status updated to ${updatedBlog.status}`,
      data: updatedBlog
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
