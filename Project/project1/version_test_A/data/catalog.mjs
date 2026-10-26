const typeOrder = [
  'Jacket', 'T-Shirt', 'Pants', 'Bag', 'Cap', 'Hoodie',
  'Long Sleeve T-Shirt', 'Shorts', 'Puffer Jacket', 'Knitwear',
  'Shirt', 'Shoes', 'Beanie', 'Hat', 'Scarf', 'Tights',
  'Clothing Accessories', 'Wallet', 'Gloves'
];

export const categoryGroups = {
  outer: ['outer', 'jackets', 'puffers'],
  top: ['top', 't-shirts', 'hoodies', 'long-sleeves', 'knitwear', 'shirts'],
  bottom: ['bottom', 'pants', 'shorts'],
  accessories: ['accessories', 'bags', 'headwear', 'shoes', 'etc'],
  collaborations: ['collaborations', 'nothing', 'sealson', 'yuminha', 'puma', 'oasis', 'beautiful', 'ryoji-ikeda']
};

export function categoryLabel(category) {
  return ({
    't-shirts': 'T-SHIRTS',
    'long-sleeves': 'LONG SLEEVES',
    beautiful: 'b.Eautiful',
    'ryoji-ikeda': 'RYOJI IKEDA'
  })[category] || category.replaceAll('-', ' ').toUpperCase();
}

export function getCategoryGroup(path) {
  const prefix = '/collections/san-san-gear-';
  if (!path.startsWith(prefix)) return undefined;
  const category = path.slice(prefix.length).replace(/\/$/, '');
  return Object.keys(categoryGroups).find(parent => categoryGroups[parent].includes(category));
}

function interleaveTypes(products) {
  const buckets = new Map(typeOrder.map(type => [type, []]));
  for (const product of products) {
    if (!buckets.has(product.type)) buckets.set(product.type, []);
    buckets.get(product.type).push(product);
  }
  const result = [];
  for (let index = 0; result.length < products.length; index++) {
    for (const bucket of buckets.values()) {
      if (bucket[index]) result.push(bucket[index]);
    }
  }
  return result;
}

// Introduce different styles before showing the same style in more colors.
// Seasonal collections retain their original merchandising order.
export function buildAllProducts(products, collections) {
  const byHandle = new Map(products.map(product => [product.handle, product]));
  const handles = new Set([
    ...['fw26', 'ss26', 'fw25', 'ss25']
      .flatMap(season => collections['/collections/san-san-gear-' + season] || []),
    ...(collections['/collections/toji-fw26'] || []),
    ...products.map(product => product.handle)
  ]);
  const styles = new Set();
  const firstColors = [];
  const otherColors = [];
  for (const handle of handles) {
    const product = byHandle.get(handle);
    if (!product) continue;
    const style = product.type + ':' + product.title.trim().toLowerCase();
    (styles.has(style) ? otherColors : firstColors).push(product);
    styles.add(style);
  }
  return [...interleaveTypes(firstColors), ...interleaveTypes(otherColors)];
}
