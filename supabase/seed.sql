insert into public.charities (name, slug, description, tagline, featured)
values
  (
    'Fairway Futures Youth Fund',
    'fairway-futures',
    'Scholarships and mentorship for young people in underserved communities — no golf background required.',
    'Every round you log helps a student take their next step.',
    true
  ),
  (
    'Green Roots Restoration',
    'green-roots',
    'Native habitat restoration and water stewardship programs where courses meet conservation.',
    'Impact measured in acres restored, not strokes gained.',
    true
  ),
  (
    'Community Pantry Alliance',
    'community-pantry',
    'Neighborhood food security with dignity-first distribution and mobile pantry routes.',
    'Small subscriptions, outsized meals.',
    false
  )
on conflict (slug) do nothing;
