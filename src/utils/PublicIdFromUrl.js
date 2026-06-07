const getPublicIdFromDynamicUrl = (url) => {
  const regex = /\/upload\/(?:[^\/]+\/)*(?:v\d+\/)?([^\.]+)/i;
  const match = url.match(regex);

  if (match && match[1]) {
    return match[1];
  }
  return null;
};

export default getPublicIdFromDynamicUrl;