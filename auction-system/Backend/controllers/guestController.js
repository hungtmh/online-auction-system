import { supabase } from "../config/supabase.js";

// Helper: enrich products with bid aggregates and highest bidder profile
async function enrichProducts(products) {
  if (!products || products.length === 0) return [];

  const productIds = products.map((p) => p.id);

  const { data: bidsData } = await supabase.from("bids").select("product_id, bid_amount, bidder_id").in("product_id", productIds).order("bid_amount", { ascending: false });

  const bidsByProduct = new Map();
  if (bidsData) {
    for (const b of bidsData) {
      if (!bidsByProduct.has(b.product_id)) bidsByProduct.set(b.product_id, []);
      bidsByProduct.get(b.product_id).push(b);
    }
  }

  const highestBidderIds = new Set();
  let enriched = products.map((p) => {
    const bids = bidsByProduct.get(p.id) || [];
    const bid_count = bids.length;
    const highest = bids.length > 0 ? bids[0] : null;
    const current_price = highest ? highest.bid_amount : p.current_price || p.starting_price || 0;
    const highest_bidder_id = highest ? highest.bidder_id : null;
    if (highest_bidder_id) highestBidderIds.add(highest_bidder_id);
    return {
      ...p,
      bid_count,
      current_price,
      highest_bidder_id,
    };
  });

  if (highestBidderIds.size > 0) {
    const ids = Array.from(highestBidderIds);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    const profileMap = new Map((profiles || []).map((pr) => [pr.id, pr]));
    enriched = enriched.map((p) => ({
      ...p,
      highest_bidder: p.highest_bidder_id ? profileMap.get(p.highest_bidder_id) : null,
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

    const selectStr = `*, categories ( id, name, parent_id )`;

    let query = supabase
      .from("products")
      .select(selectStr, { count: "exact" })
      .eq("status", status)
      .range(offset, offset + limitNum - 1);

    if (sort === "ending_soon") query = query.order("end_time", { ascending: true });
    else if (sort === "price_asc") query = query.order("starting_price", { ascending: true });
    else query = query.order("created_at", { ascending: false });

    if (category) query = query.eq("category_id", category);

    const { data, error, count } = await query;
    if (error) throw error;

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
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        categories ( id, name, parent_id ),
        product_descriptions ( content ),
        bids ( id, bid_amount, created_at, bidder_id, profiles ( full_name ) )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

    const bids = data.bids || [];
    bids.sort((a, b) => b.bid_amount - a.bid_amount);
    const highest = bids.length > 0 ? bids[0] : null;
    const current_price = highest ? highest.bid_amount : data.current_price || data.starting_price || 0;

    res.json({ success: true, data: { ...data, bids, current_price, highest_bidder: highest ? highest.profiles : null } });
  } catch (error) {
    console.error("❌ Error getting product:", error);
    res.status(500).json({ success: false, message: "Không thể lấy thông tin sản phẩm" });
  }
};

/**
 * GET /api/guest/search?q=
 */
export const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;
    if (!q) return res.status(400).json({ success: false, message: "Vui lòng nhập từ khóa tìm kiếm" });
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const { data, error, count } = await supabase
      .from("products")
      .select(`*, categories ( id, name )`, { count: "exact" })
      .textSearch("search_vector", q)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;

    const enriched = await enrichProducts(data || []);
    res.json({ success: true, data: enriched, meta: { page: pageNum, limit: limitNum, total: count }, query: q });
  } catch (error) {
    console.error("❌ Error searching products:", error);
    res.status(500).json({ success: false, message: "Lỗi khi tìm kiếm sản phẩm" });
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
    // Mặc định lấy 6 sản phẩm cho mỗi nhóm
    const limitNum = 6;

    // Helper function để gọi RPC và enrich data
    // (Gần giống logic cũ của bạn, nhưng được tách ra)
    const processRpc = async (rpcName) => {
      const { data: rpcData, error } = await supabase.rpc(rpcName, { limit_count: limitNum });
      if (error) throw error;

      // Map RPC data to product shape
      const mapped = (rpcData || []).map((r) => ({
        id: r.product_id || r.id,
        title: r.product_name || r.name || null,
        name: r.product_name || r.name || null,
        image_url: r.thumbnail_url || r.image_url || null,
        current_price: r.current_price ?? null,
        bid_count: r.bid_count ?? null,
      }));

      // Enrich (thêm thông tin bidder, v.v.)
      return await enrichProducts(mapped);
    };

    // Gọi cả 3 hàm RPC song song để tăng tốc độ
    const [ending_soon_data, most_bids_data, highest_price_data] = await Promise.all([processRpc("get_top_ending_soon"), processRpc("get_top_most_bids"), processRpc("get_top_highest_price")]);

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
