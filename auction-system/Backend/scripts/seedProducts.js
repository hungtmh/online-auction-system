import { supabase } from '../config/supabase.js';

const seedProducts = async () => {
  const products = [
    {
      title: 'iPhone 15 Pro Max',
      description: 'Điện thoại cao cấp của Apple, màu Titan.',
      image_url: 'https://via.placeholder.com/300x200?text=iPhone+15+Pro+Max',
      starting_price: 25000000,
      status: 'pending',
    },
    {
      title: 'MacBook Pro 2024',
      description: 'Laptop mạnh mẽ dành cho lập trình viên.',
      image_url: 'https://via.placeholder.com/300x200?text=MacBook+Pro+2024',
      starting_price: 50000000,
      status: 'approved',
    },
    {
      title: 'Samsung Galaxy S23 Ultra',
      description: 'Điện thoại flagship của Samsung.',
      image_url: 'https://via.placeholder.com/300x200?text=Galaxy+S23+Ultra',
      starting_price: 20000000,
      status: 'rejected',
    },
    {
      title: 'Sony WH-1000XM5',
      description: 'Tai nghe chống ồn tốt nhất.',
      image_url: 'https://via.placeholder.com/300x200?text=Sony+WH-1000XM5',
      starting_price: 7000000,
      status: 'completed',
    },
  ];

  for (const product of products) {
    const { error } = await supabase.from('products').insert(product);

    if (error) {
      console.error('❌ Error inserting product:', product.title, error);
    } else {
      console.log('✅ Inserted product:', product.title);
    }
  }

  console.log('🎉 Seeding completed!');
};

seedProducts();