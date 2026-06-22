export const environment = {
  production: false,
  supabaseUrl: 'https://zspihbzhewrgjweesthc.supabase.co',
  // anon / publishable key — safe in client code (protected by Row Level Security)
  supabaseKey: 'sb_publishable_hN9Ka3AonLiAeUlSNw0ueA_dgf9Axi4',

  // Cloudinary — unsigned upload (no secret needed in client code).
  // Fill these in: cloud name + an UNSIGNED upload preset name.
  cloudinaryCloudName: 'dpuvlgxsa',
  cloudinaryUploadPreset: 'nvblarup'
};
