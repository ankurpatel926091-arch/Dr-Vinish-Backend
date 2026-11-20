import Blog from '../models/Blog.js';

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
    const { search, category, status, page, limit } = req.query;
    const conditions = [];

    const escapeRegex = (val) => String(val).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (status && String(status).trim().toLowerCase() !== 'all') {
      conditions.push({
        status: new RegExp(`^${escapeRegex(String(status).trim())}$`, 'i')
      });
    }

    if (category && String(category).trim().toLowerCase() !== 'all') {
      conditions.push({
        category: new RegExp(`^${escapeRegex(String(category).trim())}$`, 'i')
      });
    }

    if (search && String(search).trim()) {
      const searchRegex = new RegExp(escapeRegex(String(search).trim()), 'i');
      conditions.push({
        $or: [
          { title: searchRegex },
          { category: searchRegex },
          { shortDescription: searchRegex }
        ]
      });
    }

    const mongoQuery = conditions.length > 0 ? { $and: conditions } : {};
    const total = await Blog.countDocuments(mongoQuery);

    let query = Blog.find(mongoQuery).sort({ createdAt: -1 });

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const isPaginated = !isNaN(pageNum) && pageNum > 0 && !isNaN(limitNum) && limitNum > 0;

    if (isPaginated) {
      const skip = (pageNum - 1) * limitNum;
      query = query.skip(skip).limit(limitNum);
    }

    const blogs = await query;

    res.json({
      success: true,
      total,
      page: isPaginated ? pageNum : 1,
      totalPages: isPaginated ? Math.ceil(total / limitNum) : 1,
      limit: isPaginated ? limitNum : total,
      count: blogs.length,
      data: blogs
    });
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
