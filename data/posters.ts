export type Poster = {
  id: string
  title: string
  /** Image base path under /public (no extension). */
  image: string
}

export type Station = {
  station: number
  title: string
  posters: Poster[]
}

export const stations: Station[] = [
  {
    station: 1,
    title: "Shaping Group Direction",
    posters: [
      { id: "01", title: "Caravan", image: "/posters/station-01/1. Caravan" },
      { id: "02", title: "LNG Canada Phase 2", image: "/posters/station-01/2. LNG Canada Phase 2" },
      { id: "03", title: "ARC Resources Acquisition", image: "/posters/station-01/3. ARC Resources Acquisition" },
      { id: "04", title: "Orion (ETS27)", image: "/posters/station-01/4. Orion (ETS27)" },
    ],
  },
  {
    station: 2,
    title: "Energy and Market Fundamentals",
    posters: [
      { id: "05", title: "Global Power Fundamentals Analysis and Governance", image: "/posters/station-02/1. Global Power Fundamentals Analysis and Governance" },
      { id: "06", title: "Oil and Chemicals Screening Values", image: "/posters/station-02/2. Oil and Chemicals Screening Values" },
      { id: "07", title: "Crocus Scenarios", image: "/posters/station-02/3. Crocus Scenarios" },
      { id: "08", title: "Long-term Oil Supply Analysis", image: "/posters/station-02/4. Long-term Oil Supply Analysis_" },
    ],
  },
  {
    station: 3,
    title: "Market Engagement and External Insights",
    posters: [
      { id: "09", title: "Coordinating Shell’s Quarterly results presentations", image: "/posters/station-03/1. Coordinating Shell’s Quarterly results presentations" },
      { id: "10", title: "Shell – DRC Collaboration", image: "/posters/station-03/2. Shell – DRC Collaboration​" },
      { id: "11", title: "More from Less", image: "/posters/station-03/3. More from Less" },
      { id: "12", title: "Global pace of the energy transition", image: "/posters/station-03/4. Global pace of the energy transition" },
    ],
  },
  {
    station: 4,
    title: "Data, digital and AI",
    posters: [
      { id: "13", title: "OP26 Digital Transformation", image: "/posters/station-04/1. OP26 Digital Transformation" },
      { id: "14", title: "Strategy Fabric", image: "/posters/station-04/2. Strategy Fabric" },
      { id: "15", title: "IR AI Journey", image: "/posters/station-04/3. IR AI Journey" },
      { id: "16", title: "SIC Digital Transformation", image: "/posters/station-04/4. SIC Digital Transformation" },
    ],
  },
  {
    station: 5,
    title: "Collaboration and Learning",
    posters: [
      { id: "17", title: "Learn and Engage Poster", image: "/posters/station-05/1. Learn and Engage Poster" },
      { id: "18", title: "AI in SCA, Coaching the community on AI use", image: "/posters/station-05/2. AI in SCA, Coaching the community on AI use_" },
      { id: "19", title: "Mastering Strategy. Building world-class strategic thinkers", image: "/posters/station-05/3. Mastering Strategy. Building world-class strategic thinkers_" },
      { id: "20", title: "Energy Systems Course", image: "/posters/station-05/4. Energy Systems Course" },
    ],
  },
]

export default stations
