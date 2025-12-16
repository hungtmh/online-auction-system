import { supabase } from "../config/supabase.js";

// Helper: enrich products with bid aggregates and highest bidder profile
async function enrichProducts(products) {
  if (!products || products.length === 0) return [];

  const productIds = products.map((p) => p.id);

  // Lấy bids data
  const { data: bidsData } = await supabase.from("bids").select("product_id, bid_amount, bidder_id, is_rejected").in("product_id", productIds).order("bid_amount", { ascending: false });

  const bidsByProduct = new Map();
  if (bidsData) {
    for (const b of bidsData) {
      if (b.is_rejected) continue;
      if (!bidsByProduct.has(b.product_id)) bidsByProduct.set(b.product_id, []);
      bidsByProduct.get(b.product_id).push(b);
    }
  }

  // Thu thập seller IDs và bidder IDs
  const sellerIds = new Set();
  const highestBidderIds = new Set();

  products.forEach((p) => {
    if (p.seller_id) sellerIds.add(p.seller_id);
  });

  let enriched = products.map((p) => {
    const bids = bidsByProduct.get(p.id) || [];
    const bid_count = bids.length;
    const highest = bids.length > 0 ? bids[0] : null;
    const current_price = highest ? highest.bid_amount : p.current_price || p.starting_price || 0;
    const highest_bidder_id = highest ? highest.bidder_id : null;
    if (highest_bidder_id) highestBidderIds.add(highest_bidder_id);

    return {
      ...p,
      title: p.name || p.title, // Map name -> title for frontend
      category_name: p.categories?.name,
      category_id: p.categories?.id || p.category_id,
      image_url: p.thumbnail_url || p.image_url,
      bid_count,
      current_price,
      highest_bidder_id,
    };
  });

  // Lấy thông tin profiles (cả seller và bidder)
  const allProfileIds = new Set([...sellerIds, ...highestBidderIds]);

  if (allProfileIds.size > 0) {
    const ids = Array.from(allProfileIds);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    const profileMap = new Map((profiles || []).map((pr) => [pr.id, pr]));

    enriched = enriched.map((p) => ({
      ...p,
      seller_name: p.seller_id ? profileMap.get(p.seller_id)?.full_name : null,
      highest_bidder: p.highest_bidder_id ? profileMap.get(p.highest_bidder_id) : null,
      highest_bidder_name: p.highest_bidder_id ? profileMap.get(p.highest_bidder_id)?.full_name : null,
    }));
  }

  return enriched;
}

/**
 * GET /api/guest/products
 * public product list with pagination, optional category and sort
 */
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, status = "active", sort } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    console.log("📦 getProducts params:", { page: pageNum, limit: limitNum, category, status, sort });

    const selectStr = `*, categories ( id, name, parent_id )`;

    let query = supabase
      .from("products")
      .select(selectStr, { count: "exact" })
      .eq("status", status)
      .range(offset, offset + limitNum - 1);

    if (sort === "ending_soon") query = query.order("end_time", { ascending: true });
    else if (sort === "price_asc") query = query.order("starting_price", { ascending: true });
    else query = query.order("created_at", { ascending: false });

    if (category) {
      console.log("🏷️  Filtering by category:", category);
      query = query.eq("category_id", category);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("❌ Supabase query error:", error);
      throw error;
    }

    console.log(`✅ Found ${data?.length} products (total: ${count})`);

    const enriched = await enrichProducts(data || []);

    res.json({ success: true, data: enriched, meta: { page: pageNum, limit: limitNum, total: count } });
  } catch (error) {
    console.error("❌ Error getting products:", error);
    res.status(500).json({ success: false, message: "Không thể lấy danh sách sản phẩm" });
  }
};

/**
 * GET /api/guest/products/:id
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("📦 Getting product detail:", id);

    // Query product với categories và descriptions
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(
        `
        *,
        categories ( id, name, parent_id ),
        product_descriptions ( id, description, added_at )
      `
      )
      .eq("id", id)
      .single();

    if (productError) {
      console.error("❌ Product query error:", productError);
      throw productError;
    }

    if (!product) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

    // Query seller info
    const { data: seller } = await supabase.from("profiles").select("id, full_name, rating_positive, rating_negative").eq("id", product.seller_id).single();

    // Query bids với bidder profiles - QUAN TRỌNG: lấy cả max_bid_amount để xác định người giữ giá
    const { data: bids } = await supabase.from("bids").select("id, bid_amount, max_bid_amount, created_at, bidder_id, is_rejected, rejected_at, profiles:bidder_id ( id, full_name, rating_positive, rating_negative )").eq("product_id", id).order("created_at", { ascending: false });

    // Query questions với asker profiles
    const { data: questions } = await supabase.from("questions").select("id, question, answer, answered_at, created_at, asker_id, profiles:asker_id ( full_name )").eq("product_id", id).order("created_at", { ascending: false });

    const sortedBids = bids || [];
    const activeBids = sortedBids.filter((b) => !b.is_rejected);

    // Tìm người giữ giá cao nhất dựa trên max_bid_amount (không phải bid_amount)
    // Nếu cùng max thì người đặt trước thắng
    let highest = null;
    const bidderMaxMap = new Map();

    for (const bid of activeBids) {
      const bidderId = bid.bidder_id;
      const maxBid = Number(bid.max_bid_amount) || Number(bid.bid_amount) || 0;
      const existing = bidderMaxMap.get(bidderId);

      if (!existing || maxBid > existing.max) {
        bidderMaxMap.set(bidderId, {
          max: maxBid,
          created_at: bid.created_at,
          bid: bid,
        });
      }
    }

    // Tìm người có max cao nhất
    for (const [bidderId, data] of bidderMaxMap.entries()) {
      if (!highest || data.max > highest.max || (data.max === highest.max && new Date(data.created_at) < new Date(highest.created_at))) {
        highest = data;
      }
    }

    const highestBid = highest?.bid || null;
    const current_price = activeBids.length > 0 ? Math.max(...activeBids.map((b) => Number(b.bid_amount) || 0)) : product.current_price || product.starting_price || 0;

    // Format response với đầy đủ thông tin
    const response = {
      ...product,
      bids: activeBids,
      seller_bids: sortedBids,
      current_price,
      bid_count: activeBids.length,
      seller_name: seller?.full_name,
      seller_rating_positive: seller?.rating_positive || 0,
      seller_rating_negative: seller?.rating_negative || 0,
      highest_bidder: highestBid?.profiles || null,
      highest_bidder_name: highestBid?.profiles?.full_name || null,
      highest_bidder_rating_positive: highestBid?.profiles?.rating_positive || 0,
      highest_bidder_rating_negative: highestBid?.profiles?.rating_negative || 0,
      description: product.description || "",
      description_history: (product.product_descriptions || []).sort((a, b) => new Date(a.added_at) - new Date(b.added_at)),
      questions: questions || [],
    };

    console.log("✅ Product detail loaded successfully");

    res.json({ success: true, data: response });
  } catch (error) {
    console.error("❌ Error getting product:", error);
    res.status(500).json({ success: false, message: "Không thể lấy thông tin sản phẩm" });
  }
};

/**
 * Hàm hỗ trợ bỏ dấu tiếng Việt
 */
function removeVietnameseTones(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
}

/**
 * GET /api/guest/search?q=
 */
export const searchProducts = async (req, res) => {
  try {
    const {
      q: rawQ,
      category,
      sort = "",
      page = 1,
      limit = 12,
      price_min,
      price_max,
      time_remaining, // hours (ví dụ: 24 = còn ít hơn 24h)
    } = req.query;

    const q = rawQ ? String(rawQ) : "";

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase.from("products").select("*, categories(id, name, parent_id)", { count: "exact" }).eq("status", "active");

    // Full-text-search
    if (q) {
      const cleanQ = removeVietnameseTones(q);
      const keywords = cleanQ
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);

      if (keywords.length > 0) {
        // 3. Tạo chuỗi truy vấn Prefix (Ví dụ: 'Tui':* & 'xach':*)
        // :* nghĩa là tìm từ bắt đầu bằng... (Full Text Search Prefix)
        const searchQuery = keywords.map((word) => `'${word}':*`).join(" & ");

        console.log("🔍 Search Query:", searchQuery);

        // 4. Gọi lệnh tìm kiếm xuống DB
        query = query.textSearch("search_vector", searchQuery, {
          config: "simple", // Khớp với config trong Supabase
        });
      }
    }

    // FILTER THEO GIÁ
    if (price_min) {
      query = query.gte("current_price", parseFloat(price_min));
    }
    if (price_max) {
      query = query.lte("current_price", parseFloat(price_max));
    }

    // FILTER THEO THỜI GIAN CÒN LẠI (hours)
    if (time_remaining) {
      const now = new Date();
      const maxEndTime = new Date(now.getTime() + time_remaining * 60 * 60 * 1000);
      query = query.lte("end_time", maxEndTime.toISOString());
    }

    // Category filter
    if (category) {
      query = query.eq("category_id", category);
    }

    // Sorting
    if (sort === "ending_soon") {
      query = query.order("end_time", { ascending: true });
    } else if (sort === "price_asc") {
      query = query.order("current_price", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("current_price", { ascending: false });
    } else if (sort === "most_bids") {
      query = query.order("bid_count", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limitNum - 1);

    // console.log(" Server Time:", new Date().toISOString());
    // console.log(" Query Params:", req.query);
    // console.log(" Generated URL:", query);
    const { data, error, count } = await query;
    // console.log(" Raw Data from DB:", data);
    // console.log(` Found ${data?.length} products (total: ${count})`);
    if (error) throw error;

    const enriched = await enrichProducts(data || []);

    res.json({
      success: true,
      data: enriched,
      meta: { page: pageNum, limit: limitNum, total: count },
    });
  } catch (error) {
    console.error("❌ Error searching products:", error);
    res.status(500).json({ success: false, message: "Lỗi tìm kiếm sản phẩm" });
  }
};

/**
 * GET /api/guest/categories
 */
export const getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error("❌ Error getting categories:", error);
    res.status(500).json({ success: false, message: "Không thể lấy danh mục" });
  }
};

/**
 * GET /api/guest/featured?type=&limit=
 */
export const getFeaturedProducts = async (req, res) => {
  try {
    // Lấy 5 sản phẩm cho mỗi nhóm
    const limitNum = 5;

    console.log("🌟 Loading featured products...");

    // Lấy thời gian hiện tại để lọc sản phẩm còn đang đấu giá
    const now = new Date().toISOString();

    // Query TẤT CẢ sản phẩm active VÀ chưa hết thời gian đấu giá
    const allProductsQuery = supabase.from("products").select("*, categories(id, name, parent_id)").eq("status", "active").gt("end_time", now); // Chỉ lấy sản phẩm có end_time > hiện tại

    // Lấy tất cả sản phẩm còn đang đấu giá
    const { data: allProducts, error } = await allProductsQuery;

    if (error) throw error;

    console.log("📦 Total active products (still ongoing):", allProducts?.length);

    // Enrich tất cả sản phẩm
    const enrichedAll = await enrichProducts(allProducts || []);

    // Bây giờ mới sort và limit
    const ending_soon_data = [...enrichedAll].sort((a, b) => new Date(a.end_time) - new Date(b.end_time)).slice(0, limitNum);

    const most_bids_data = [...enrichedAll].sort((a, b) => (b.bid_count || 0) - (a.bid_count || 0)).slice(0, limitNum);

    const highest_price_data = [...enrichedAll].sort((a, b) => (b.current_price || 0) - (a.current_price || 0)).slice(0, limitNum);

    console.log("✅ Featured products sorted");
    console.log(
      "⏰ Top ending soon:",
      ending_soon_data.map((p) => ({ name: p.title, end: p.end_time }))
    );
    console.log(
      "🔥 Top most bids:",
      most_bids_data.map((p) => ({ name: p.title, bids: p.bid_count }))
    );
    console.log(
      "💎 Top highest price:",
      highest_price_data.map((p) => ({ name: p.title, price: p.current_price }))
    );

    // Tạo object data mà frontend mong đợi
    const responseData = {
      ending_soon: ending_soon_data || [],
      most_bids: most_bids_data || [],
      highest_price: highest_price_data || [],
    };

    // Trả về object này trong thuộc tính 'data'
    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error("❌ Error getting featured products:", error);
    res.status(500).json({ success: false, message: "Không thể lấy sản phẩm nổi bật" });
  }
};

/**
 * GET /api/guest/sellers/:id
 * Public seller profile lookup for displaying seller info alongside products.
 */
export const getSellerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Thiếu mã người bán" });
    }

    const { data: seller, error } = await supabase.from("profiles").select("id, full_name, rating_positive, rating_negative, phone, address").eq("id", id).maybeSingle();

    if (error) throw error;

    if (!seller) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người bán" });
    }

    res.json({ success: true, data: seller });
  } catch (error) {
    console.error("❌ Error getting seller profile:", error);
    res.status(500).json({ success: false, message: "Không thể lấy thông tin người bán" });
  }
};

/**
 * GET /api/guest/settings
 * Lấy cài đặt hệ thống công khai cho Seller validation
 */
export const getPublicSettings = async (req, res) => {
  try {
    const { data: rows, error } = await supabase.from("system_settings").select("key, value").in("key", ["min_bid_increment_percent", "default_auction_duration_days"]);

    if (error) throw error;

    const settings = {};
    for (const row of rows || []) {
      settings[row.key] = row.value;
    }

    res.json({ success: true, data: { settings } });
  } catch (error) {
    console.error("❌ Error getting public settings:", error);
    res.status(500).json({ success: false, message: "Không thể lấy cài đặt hệ thống" });
  }
};
