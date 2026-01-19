/*
 * This file was created by CursorAI and Cursor IDE, to mix and match the ids from artists, with NFTs
 */

import { join } from "path";
import { readFileSync, writeFileSync } from "fs";

// Read the data files
const artistsPath = join(process.cwd(), "server/data/artists.json");
const nftsPath = join(process.cwd(), "server/data/NFTs.json");

const artistsData = JSON.parse(readFileSync(artistsPath, "utf-8"));
const nftsData = JSON.parse(readFileSync(nftsPath, "utf-8"));

// Update NFTs with creator IDs
const updatedNFTs = nftsData.map((nft: any) => {
  if (!nft.creatorId) {
    // Get a random artist ID
    const randomArtist =
      artistsData[Math.floor(Math.random() * artistsData.length)];
    nft.creatorId = randomArtist.id;
  }
  return nft;
});

// Update artists with their NFTs
const updatedArtists = artistsData.map((artist: any) => {
  // Find all NFTs created by this artist
  const artistNFTs = updatedNFTs
    .filter((nft: any) => nft.creatorId === artist.id)
    .map((nft: any) => nft.id);

  artist.nfts = artistNFTs;
  return artist;
});

// Write the updated data back to files
writeFileSync(artistsPath, JSON.stringify(updatedArtists, null, 2));
writeFileSync(nftsPath, JSON.stringify(updatedNFTs, null, 2));

console.log("Successfully updated relationships between NFTs and artists!");
