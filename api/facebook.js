export default async function handler(req, res) {
  const { pageId, token } = req.query;
  const url = `https://graph.facebook.com/v19.0/${pageId}/insights?metric=page_impressions_unique,page_post_engagements,page_fans&period=day&access_token=${token}`;
  const response = await fetch(url);
  const data = await response.json();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(data);
}
