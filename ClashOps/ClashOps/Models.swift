//Imports
import SwiftUI
import Foundation
import CoreData

// Keys and URLs
let OPENAI_API_KEY = (NSDictionary(contentsOfFile: Bundle.main.path(forResource: "Config", ofType: "plist") ?? "")?["OPENAI_API_KEY"] as? String) ?? ""
let decksURL = (NSDictionary(contentsOfFile: Bundle.main.path(forResource: "Config", ofType: "plist") ?? "")?["DECKS_URL"] as? String) ?? ""
let cardsURL = (NSDictionary(contentsOfFile: Bundle.main.path(forResource: "Config", ofType: "plist") ?? "")?["CARDS_URL"] as? String) ?? ""
let featuresURL = (NSDictionary(contentsOfFile: Bundle.main.path(forResource: "Config", ofType: "plist") ?? "")?["FEATURES_URL"] as? String) ?? ""
let reportsURL = (NSDictionary(contentsOfFile: Bundle.main.path(forResource: "Config", ofType: "plist") ?? "")?["REPORTS_URL"] as? String) ?? ""
let accountName: String = "clashopsstorageaccount"
let containerName: String = "clashopscontainer"
let blobName: String = "reports.csv"
let sasToken: String = (NSDictionary(contentsOfFile: Bundle.main.path(forResource: "Config", ofType: "plist") ?? "")?["SAS_TOKEN"] as? String) ?? ""
let optimizeURL: String = (NSDictionary(contentsOfFile: Bundle.main.path(forResource: "Config", ofType: "plist") ?? "")?["OPTIMIZE_URL"] as? String) ?? ""
let analyzeURL: String = (NSDictionary(contentsOfFile: Bundle.main.path(forResource: "Config", ofType: "plist") ?? "")?["ANALYZE_URL"] as? String) ?? ""
let createReportURL: String = (NSDictionary(contentsOfFile: Bundle.main.path(forResource: "Config", ofType: "plist") ?? "")?["CREATE_REPORT_URL"] as? String) ?? ""

// Grid layouts
let fourColumnGrid: [GridItem] = Array(repeating: GridItem(.flexible()), count: 4)
let fiveColumnGrid: [GridItem] = Array(repeating: GridItem(.flexible()), count: 5)
let sixColumnGrid: [GridItem] = Array(repeating: GridItem(.flexible()), count: 6)
let eightColumnGrid: [GridItem] = Array(repeating: GridItem(.flexible()), count: 8)


struct createReportRequest: Codable {
    let deck: String
}

struct Offense: Codable {
    let offense: Category
    
    enum CodingKeys: String, CodingKey {
        case offense = "Offense"
    }
}

struct Defense: Codable {
    let defense: Category
    
    enum CodingKeys: String, CodingKey {
        case defense = "Defense"
    }
}

struct Synergy: Codable {
    let synergy: SynergyDetails
    enum CodingKeys: String, CodingKey {
        case synergy = "Synergy"
    }
}

struct Versatility: Codable {
    let versatility: VersatilityDetails
    enum CodingKeys: String, CodingKey {
        case versatility = "Versatility"
    }
}

struct Optimize: Codable {
    let swaps: SwapsDetails
    let towerTroop: TowerTroopDetails
    let evolutions: EvolutionDetails
    enum CodingKeys: String, CodingKey {
        case swaps = "Recommended Swaps"
        case towerTroop = "Recommended Tower Troop"
        case evolutions = "Recommended Evolutions"
    }
}

struct EvolutionDetails: Codable {
    let evolutions: [evolution]
    let reasoning: String
    enum CodingKeys: String, CodingKey {
        case evolutions = "Evolutions"
        case reasoning = "Reasoning"
    }
}

struct evolution: Codable {
    let evolution: String
    enum CodingKeys: String, CodingKey {
        case evolution = "Evolution"
    }
}

struct SwapsDetails: Codable {
    let swaps: [Swap]
    let improvementSummary: String
    enum CodingKeys: String, CodingKey {
        case swaps = "Swaps"
        case improvementSummary = "Improvement Summary"
    }
}

struct TowerTroopDetails: Codable {
    let towerTroop: String
    let reasoning: String
    enum CodingKeys: String, CodingKey {
        case towerTroop = "Tower Troop"
        case reasoning = "Reasoning"
    }
}

struct Swap: Codable {
    let replacedCard: String
    let newCard: String
    enum CodingKeys: String, CodingKey  {
        case replacedCard = "Replaced Card"
        case newCard = "New Card"
    }
}


// MARK: - Offense / Defense Categories
struct Category: Codable {
    let score: Double
    let summary: String
    let roles: [String: Role]
    
    enum CodingKeys: String, CodingKey {
        case score = "Score"
        case summary = "Summary"
        case roles = "Roles"
    }
}

// MARK: - Role (e.g., WinConditions, AirDefense, etc.)
struct Role: Codable {
    let score: Double
    let summary: String
    let cards: [String]
    
    enum CodingKeys: String, CodingKey {
        case score = "Score"
        case summary = "Summary"
        case cards = "Cards"
    }
}

// MARK: - Card Entry (like {"Royal Hogs": {"Score": 5, "Description": "..."}})
struct CardEntry: Codable {
    let name: String
    let details: CardDetails
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let dict = try container.decode([String: CardDetails].self)
        guard let (key, value) = dict.first else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "CardEntry missing data")
        }
        self.name = key
        self.details = value
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode([name: details])
    }
}

struct CardDetails: Codable {
    let score: Double
    let description: String
    
    enum CodingKeys: String, CodingKey {
        case score = "Score"
        case description = "Description"
    }
}

// MARK: - Synergy
struct SynergyDetails: Codable {
    let score: Double
    let summary: String
    let combos: [String: Combo]

    enum CodingKeys: String, CodingKey {
        case score = "Score"
        case summary = "Summary"
        case combos = "Combos"
    }
}

// MARK: - Versatility
struct VersatilityDetails: Codable {
    let score: Double
    let summary: String
    let archetypes: [String: Archetype]
    
    enum CodingKeys: String, CodingKey {
        case score = "Score"
        case summary = "Summary"
        case archetypes = "Archetypes"
    }
}

struct Archetype: Codable {
    let score: Double
    let description: String
    
    enum CodingKeys: String, CodingKey {
        case score = "Score"
        case description = "Description"
    }
}

struct Combo: Codable {
    let score: Double
    let summary: String
    let cards: [String]
    
    enum CodingKeys: String, CodingKey {
        case score = "Score"
        case summary = "Summary"
        case cards = "Cards"
    }
}

struct optimizeRequest: Codable {
    let deckToAnalyze: String
    let offenseScore: Double
    let defenseScore: Double
    let synergyScore: Double
    let versatilityScore: Double
    let offenseSummary: String
    let defenseSummary: String
    let synergySummary: String
    let versatilitySummary: String
}

struct analysisRequest: Codable {
    let deckToAnalyze: String
    let category: String
}

struct analysisResponse: Codable {
    let content: String
    let category: String
}


struct offenseCategory: Codable {
    let offense: Offense
    
    enum CodingKeys: String, CodingKey {
        case offense = "Offense"
    }
}

struct defenseCategory: Codable {
    let defense: Defense
    
    enum CodingKeys: String, CodingKey {
        case defense = "Defense"
    }
}

struct synergyCategory: Codable {
    let synergy: Synergy
    
    enum CodingKeys: String, CodingKey {
        case synergy = "Synergy"
    }
}

struct versatilityCategory: Codable {
    let versatility: Versatility
    
    enum CodingKeys: String, CodingKey {
        case versatility = "Versatility"
    }
}

struct optimizeCategory: Codable {
    let optimize: Optimize
    enum CodingKeys: String, CodingKey {
        case optimize = "Optimize"
    }
}

struct LoadingSection: View {
    let isLoading: String
    let percentLoading: Int

    var body: some View {
        VStack {
            Text(isLoading + "...")
                .foregroundColor(.customForegroundGold)
                .padding(.vertical, 20)

            HStack {
                Text("\(percentLoading) %")
                    .foregroundColor(.customForegroundGold)
                    .padding(.leading, 40)
                Rectangle()
                    .fill(Color.customForegroundGold)
                    .frame(width: CGFloat(Double(percentLoading) / 100.0) * 280, height: 20)
                Spacer()
            }

            Text("This will take a few minutes. Keep this screen open.")
                .foregroundColor(.customForegroundGold)
            Spacer()
        }
    }
}

struct SectionContainer<Content: View>: View {
    let title: String
    let score: Double
    let summary: String
    let isExpanded: Bool
    let toggle: () -> Void
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading) {
            sectionHeader
            sectionBody
        }
    }

    private var sectionHeader: some View {
        HStack {
            Text(title)
                .foregroundColor(.customForegroundGold)
                .font(.system(size: 18, weight: .medium))
            letterGrade(score: score)
            Spacer()
        }
        .padding(.top, 16)
    }

    private var sectionBody: some View {
        HStack {
            Rectangle()
                .fill(Color.customForegroundGold)
                .frame(width: 1)
                .padding(.horizontal, 8)
            VStack {
                ZStack {
                    RoundedRectangle(cornerRadius: 16).fill(Color.black)
                    Text(summary)
                        .foregroundColor(.white)
                        .padding(.top, 2)
                        .padding(.horizontal, 16)
                        .font(.system(size: 12, weight: .light))
                }
                HStack {
                    Button(action: toggle) {
                        Image(systemName: isExpanded ? "arrow.down" : "arrow.right")
                            .foregroundColor(.customForegroundGold)
                    }
                    .padding(.vertical, 4)
                    .padding(.horizontal, 4)
                    Spacer()
                }
                if isExpanded {
                    content()
                }
            }
            Spacer()
        }
    }
}

struct OffenseSection: View {
    let offense: Offense?
    let isExpanded: Bool
    let toggle: () -> Void

    var roles: [(String, Role)] {
        Array(offense?.offense.roles ?? [:])
    }
    
    

    var body: some View {
        SectionContainer(
            title: "⚔️ Offense",
            score: offense?.offense.score ?? 0.0,
            summary: offense?.offense.summary ?? "None",
            isExpanded: isExpanded,
            toggle: toggle
        ) {
            ForEach(roles, id: \.0) { key, details in
                roleView(name: key, score: details.score, summary: details.summary, cards: details.cards)
            }
        }
    }
}

struct DefenseSection: View {
    let defense: Defense?
    let isExpanded: Bool
    let toggle: () -> Void

    var roles: [(String, Role)] {
        Array(defense?.defense.roles ?? [:])
    }
    
    

    var body: some View {
        SectionContainer(
            title: "⚔️ Defense",
            score: defense?.defense.score ?? 0.0,
            summary: defense?.defense.summary ?? "None",
            isExpanded: isExpanded,
            toggle: toggle
        ) {
            ForEach(roles, id: \.0) { key, details in
                roleView(name: key, score: details.score, summary: details.summary, cards: details.cards)
            }
        }
    }
}

struct SynergySection: View {
    let synergy: Synergy?
    let isExpanded: Bool
    let toggle: () -> Void

    var combos: [(String, Combo)] {
        Array(synergy?.synergy.combos ?? [:])
    }

    var body: some View {
        SectionContainer(
            title: "🔗 Synergy",
            score: synergy?.synergy.score ?? 0.0,
            summary: synergy?.synergy.summary ?? "None",
            isExpanded: isExpanded,
            toggle: toggle
        ) {
            ForEach(combos, id: \.0) { key, details in
                roleView(
                    name: key,
                    score: details.score,
                    summary: details.summary,
                    cards: details.cards
                )
            }
        }
    }
}

struct VersatilitySection: View {
    let versatility: Versatility?
    let isExpanded: Bool
    let toggle: () -> Void

    var archetypes: [(String, Archetype)] {
        Array(versatility?.versatility.archetypes ?? [:])
    }
    

    var body: some View {
        SectionContainer(
            title: "♟️ Versatility",
            score: versatility?.versatility.score ?? 0.0,
            summary: versatility?.versatility.summary ?? "None",
            isExpanded: isExpanded,
            toggle: toggle
        ) {
            ForEach(archetypes, id: \.0) { key, details in
                ArchetypeView(
                    name: key,
                    score: details.score,
                    description: details.description
                )
            }
        }
    }
}

func getImprovedDeck(deck: Deck, optimize: Optimize) -> Deck {
    var newCards: [String] = []
    var replacedCards: [String] = []
    // Load the new and replaced cards
    for swap in optimize.swaps.swaps {
        newCards.append(swap.newCard)
        replacedCards.append(swap.replacedCard)
    }
    //Filter out the replaced cards
    var filteredCards: [String] = deck.cards.filter({!replacedCards.contains($0)})
    //Append the new cards
    for card in newCards {
        filteredCards.append(card)
    }
    return Deck(id: 0, cards: filteredCards)
}
//MARK: Opt Section
struct OptimizeSection: View {
    @Binding var optimize: Optimize?
    @Binding var isOptimized: String
    @Binding var optimizeString: String
    let offenseScore: Double
    let offenseSummary: String
    let defenseScore: Double
    let defenseSummary: String
    let synergyScore: Double
    let synergySummary: String
    let versatilityScore: Double
    let versatilitySummary: String
    let deck: Deck
    let externalData: ExternalData
    var body: some View {
        if isOptimized == "yes" {
            VStack {
                HStack {
                    Text("⚡ Optimizations")
                        .foregroundColor(.customForegroundGold)
                        .font(.system(size: 18, weight: .medium))
                        Spacer()
                }
                HStack {
                    Rectangle()
                        .fill(Color.customForegroundGold)
                        .frame(width: 1)
                        .padding(.horizontal, 8)
                    .padding(.top, 0)
                    VStack {
                        HStack {
                            Text("🔄 Recommended Card Swaps")
                                .foregroundColor(.customForegroundGold)
                                .padding(.all, 2)
                                .fontWeight(.light)
                            Spacer()
                        }
                        HStack {
                            Text("Out -")
                                .foregroundColor(.red)
                                .font(.system(size: 18, weight: .bold))
                            Spacer()
                        }
                        HStack {
                            ForEach(optimize?.swaps.swaps ?? [], id: \.newCard) { swap in
                                let urlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(apiToName(api: swap.replacedCard)).png"
                                if let url = URL(string: urlString) {
                                    AsyncImage(url: url) { image in
                                        image.resizable().scaledToFit().cornerRadius(8).shadow(radius: 4)
                                    } placeholder: {
                                        ProgressView()
                                    }
                                    .frame(height: 90)
                                }
                            }
                        }
                        HStack {
                            Text("In +")
                                .foregroundColor(.green)
                                .font(.system(size: 18, weight: .bold))
                                Spacer()
                        }
                        HStack {
                            ForEach(optimize?.swaps.swaps ?? [], id: \.newCard) { swap in
                                let urlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(apiToName(api: swap.newCard)).png"
                                if let url = URL(string: urlString) {
                                    AsyncImage(url: url) { image in
                                        image.resizable().scaledToFit().cornerRadius(8).shadow(radius: 4)
                                    } placeholder: {
                                        ProgressView()
                                    }
                                    .frame(height: 90)
                                }
                            }
                        }
                        HStack {
                            ZStack {
                                Image("Elixir")
                                    .resizable()
                                    .scaledToFit()
                                    .frame(height: 30)
                                    .padding(.vertical, 8)
                                Text(String(format: "%.1f", averageElixir(deck: getImprovedDeck(deck: deck, optimize: optimize!), externalData: externalData)))
                                    .foregroundColor(Color.white)
                                    .font(.system(size: 20, weight: .bold))
                            }
                            if averageElixir(deck: getImprovedDeck(deck: deck, optimize: optimize!), externalData: externalData) < averageElixir(deck: deck, externalData: externalData) {
                                Image(systemName: "arrow.down")
                                    .foregroundColor(Color.green)
                                    .font(.system(size: 20, weight: .bold))
                            }
                            else if averageElixir(deck: getImprovedDeck(deck: deck, optimize: optimize!), externalData: externalData) > averageElixir(deck: deck, externalData: externalData) {
                                Image(systemName: "arrow.up")
                                    .foregroundColor(Color.red)
                                    .font(.system(size: 20, weight: .bold))
                            }
                            else {
                                Image(systemName: "equal")
                                    .foregroundColor(Color.yellow)
                                    .font(.system(size: 20, weight: .bold))
                            }
                            ZStack {
                                Image("Cycle")
                                    .resizable()
                                    .scaledToFit()
                                    .frame(height: 35)
                                    .padding(.vertical, 8)
                                Text(String(fastestCycle(deck: getImprovedDeck(deck: deck, optimize: optimize!), externalData: externalData)))
                                    .foregroundColor(Color.white)
                                    .font(.system(size: 20, weight: .bold))
                            }
                            if fastestCycle(deck: getImprovedDeck(deck: deck, optimize: optimize!), externalData: externalData) < fastestCycle(deck: deck, externalData: externalData) {
                                Image(systemName: "arrow.down")
                                    .foregroundColor(Color.green)
                                    .font(.system(size: 20, weight: .bold))
                            }
                            else if fastestCycle(deck: getImprovedDeck(deck: deck, optimize: optimize!), externalData: externalData) > fastestCycle(deck: deck, externalData: externalData) {
                                Image(systemName: "arrow.up")
                                    .foregroundColor(Color.red)
                                    .font(.system(size: 20, weight: .bold))
                            }
                            else {
                                Image(systemName: "equal")
                                    .foregroundColor(Color.yellow)
                                    .font(.system(size: 20, weight: .bold))
                            }
                        }
                        Text(optimize?.swaps.improvementSummary ?? "None")
                            .foregroundColor(.white)
                            .font(.system(size: 12, weight: .light))
                            .multilineTextAlignment(.leading)
                            .lineLimit(nil)                                // allow wrapping
                            .fixedSize(horizontal: false, vertical: true)  // grow vertically, don't truncate
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading) // give it width to wrap
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color.black)
                            )

                        HStack {
                            Text("🏰 Recommended Tower Troop")
                                .foregroundColor(.customForegroundGold)
                                .padding(.all, 2)
                                .fontWeight(.light)
                            Spacer()
                        }
                        let urlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(towerTroopName(name:optimize?.towerTroop.towerTroop ?? "")).png"
                        if let url = URL(string: urlString) {
                            AsyncImage(url: url) { image in
                                image.resizable().scaledToFit().cornerRadius(8).shadow(radius: 4)
                            } placeholder: {
                                ProgressView()
                            }
                            .frame(height: 90)
                        }
                        Text(optimize?.towerTroop.reasoning ?? "None")
                            .foregroundColor(.white)
                            .font(.system(size: 12, weight: .light))
                            .multilineTextAlignment(.leading)
                            .lineLimit(nil)                                // allow wrapping
                            .fixedSize(horizontal: false, vertical: true)  // grow vertically, don't truncate
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading) // give it width to wrap
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color.black)
                            )
                        HStack {
                            Text("🎆 Recommended Evolutions")
                                .foregroundColor(.customForegroundGold)
                                .padding(.all, 2)
                                .fontWeight(.light)
                            Spacer()
                        }
                        HStack {
                            ForEach(optimize?.evolutions.evolutions ?? [], id: \.evolution) { evolution in
                                let urlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(apiToName(api: evolution.evolution))-ev1.png"
                                if let url = URL(string: urlString) {
                                    AsyncImage(url: url) { image in
                                        image.resizable().scaledToFit().cornerRadius(8).shadow(radius: 4)
                                    } placeholder: {
                                        ProgressView()
                                    }
                                    .frame(height: 90)
                                }
                            }
                        }
                        Text(optimize?.evolutions.reasoning ?? "None")
                            .foregroundColor(.white)
                            .font(.system(size: 12, weight: .light))
                            .multilineTextAlignment(.leading)
                            .lineLimit(nil)                                // allow wrapping
                            .fixedSize(horizontal: false, vertical: true)  // grow vertically, don't truncate
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading) // give it width to wrap
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(Color.black)
                            )
                    }
                    
                }

            }
        }
        else if isOptimized == "no" {
            VStack {
                HStack {
                    Text("⚡ Optimizations")
                        .foregroundColor(.customForegroundGold)
                        .font(.system(size: 18, weight: .medium))
                        Spacer()
                }
                HStack {
                    Rectangle()
                        .fill(Color.customForegroundGold)
                        .frame(width: 1)
                        .padding(.horizontal, 8)
                    .padding(.top, 0)
                    VStack {
                        Button(action: {
                            Task {
                                isOptimized = "loading"
                                print(isOptimized)
                                try await (optimize, optimizeString) = getOptimizations(deckToAnalyze: "[" + deck.cards.joined(separator: ",") + "]", offenseScore: offenseScore, defenseScore: defenseScore, synergyScore: synergyScore, versatilityScore: versatilityScore, offenseSummary: offenseSummary, defenseSummary: defenseSummary, synergySummary: synergySummary, versatilitySummary: versatilitySummary)
                                isOptimized = "yes"
                            }
                            
                        }) {
                            Text("Click here to load")
                                .foregroundStyle(LinearGradient(
                                   gradient: Gradient(colors: [Color.blue, Color.teal]),
                                   startPoint: .topLeading,
                                   endPoint: .bottomTrailing
                               ))
                        }
                        Text("Optimization results include recommended card swaps, tower troop, and evolutions.")
                            .foregroundColor(Color.customForegroundGold)
                            .font(.system(size: 12, weight: .light))
                    }
                    }
                }
        }
        else if isOptimized == "loading" {
            VStack {
                HStack {
                    Text("⚡ Optimizations")
                        .foregroundColor(.customForegroundGold)
                        .font(.system(size: 18, weight: .medium))
                        Spacer()
                }
                HStack {
                    Rectangle()
                        .fill(Color.customForegroundGold)
                        .frame(width: 1)
                        .padding(.horizontal, 8)
                    .padding(.top, 0)
                    VStack {
                        Text("Loading optimizations. This may take a few minutes. Keep this screen open.")
                            .foregroundColor(Color.customForegroundGold)
                            .font(.system(size: 12, weight: .light))
                    }
                }
            }
        }
    }
}

func getOptimizations(deckToAnalyze: String, offenseScore: Double, defenseScore: Double, synergyScore: Double, versatilityScore: Double, offenseSummary: String, defenseSummary: String, synergySummary: String, versatilitySummary: String) async throws -> (Optimize, String) {
    // Function URL
    let func_URL = URL(string: optimizeURL)
    
    // Prepare request
    let payload = optimizeRequest(deckToAnalyze: deckToAnalyze, offenseScore: offenseScore, defenseScore: defenseScore, synergyScore: synergyScore, versatilityScore: versatilityScore, offenseSummary: offenseSummary, defenseSummary: defenseSummary, synergySummary: synergySummary, versatilitySummary: versatilitySummary)
    var request = URLRequest(url: func_URL!)
    request.timeoutInterval = 9999  // seconds
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONEncoder().encode(payload)
    
    // Execute request
    let (data, response) = try await URLSession.shared.data(for: request)
    
    // Check status code
    if let httpResponse = response as? HTTPURLResponse {
        print("🔍 Status code:", httpResponse.statusCode)
        print("🔍 Response body:", String(data: data, encoding: .utf8) ?? "nil")
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
    
    // Decode the response
    let decodedResponse = try JSONDecoder().decode(analysisResponse.self, from: data)
    let categoryData = decodedResponse.content.data(using: .utf8)
    let decodedCategoryData = try JSONDecoder().decode(optimizeCategory.self, from: categoryData!)
    let optimize: Optimize = decodedCategoryData.optimize
    var optimizeString: String = ""
    if let categoryData = categoryData {
        optimizeString = String(data: categoryData, encoding: .utf8) ?? "nil"
    } else {
        optimizeString = "nil"
    }
    print("Optimized")
    return (optimize, optimizeString)
}

struct MainAnalysisContent: View {
    let deck: Deck
    let externalData: ExternalData
    let offense: Offense?
    let defense: Defense?
    let synergy: Synergy?
    let versatility: Versatility?
    @Binding var optimize: Optimize?
    @Binding var dropdowns: [Bool]
    @Binding var isOptimized: String
    @Binding var optimizeString: String
    let toggleDrop: (Int) -> Void

    var body: some View {
        VStack {
            deckCardSection
            overallScoreSection
            OffenseSection(offense: offense, isExpanded: dropdowns[0], toggle: { toggleDrop(0) })
            DefenseSection(defense: defense, isExpanded: dropdowns[1], toggle: { toggleDrop(1) })
            SynergySection(synergy: synergy, isExpanded: dropdowns[2], toggle: { toggleDrop(2) })
            VersatilitySection(versatility: versatility, isExpanded: dropdowns[3], toggle: { toggleDrop(3) })
            OptimizeSection(optimize: $optimize, isOptimized: $isOptimized, optimizeString: $optimizeString, offenseScore: offense?.offense.score ?? 0.0, offenseSummary: offense?.offense.summary ?? "", defenseScore: defense?.defense.score ?? 0.0, defenseSummary: defense?.defense.summary ?? "", synergyScore: synergy?.synergy.score ?? 0.0, synergySummary: synergy?.synergy.summary ?? "", versatilityScore: versatility?.versatility.score ?? 0.0, versatilitySummary: versatility?.versatility.summary ?? "", deck: deck, externalData: externalData)
        }
        .padding(.horizontal)
    }

    private var deckCardSection: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.customBackgroundGray)
                .overlay(RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.customForegroundGold, lineWidth: 1))
            VStack {
                deckGrid(deck: deck, cardMap: externalData.cards, columns: [
                    GridItem(.flexible()), GridItem(.flexible()),
                    GridItem(.flexible()), GridItem(.flexible())
                ])
            }
            .padding(16)
        }
    }
    
    private var overallScoreSection: some View {
        HStack {
            Text("🏆 Overall Score")
                .foregroundColor(.customForegroundGold)
                .font(.system(size: 18, weight: .medium))
            letterGrade(score: averageScore(scores: [offense?.offense.score ?? 0.0, defense?.defense.score ?? 0.0, synergy?.synergy.score ?? 0.0, versatility?.versatility.score ?? 0.0]))
            Spacer()
        }
        .padding(.top, 16)
    }
}

struct HeaderSection: View {
    let dismiss: DismissAction

    var body: some View {
        VStack {
            Text("Deck Analysis")
                .font(.system(size: 36, weight: .medium))
                .foregroundStyle(gradientBlueTeal)
                .padding(.top, 16)

            HStack {
                Text("Powered by OpenAI")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundStyle(gradientBlueTeal)
                Image("OpenAI")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 30, height: 30)
            }
            .padding(.top, 4)

            HStack(spacing: 0) {
                Rectangle().fill(gradientBlueTeal).frame(height: 1)
                Image("LogoDiamond")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 80, height: 80)
                Rectangle().fill(gradientBlueTeal).frame(height: 1)
            }

            HStack {
                Button(action: { dismiss() }) {
                    HStack {
                        Image(systemName: "arrow.left")
                            .padding(.horizontal, 16)
                            .foregroundColor(.customForegroundGold)
                        Text("Back")
                            .foregroundColor(.customForegroundGold)
                    }
                }
                Spacer()
            }
        }
    }
}

 var gradientBlueTeal: LinearGradient {
    LinearGradient(
        gradient: Gradient(colors: [Color.blue, Color.teal]),
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}


func createAppendBlob(
    accountName: String,
    containerName: String,
    blobName: String,
    sasToken: String,
    completion: @escaping (Result<Void, Error>) -> Void
) {
    let urlString = "https://\(accountName).blob.core.windows.net/\(containerName)/\(blobName)?\(sasToken)"
    guard let url = URL(string: urlString) else {
        completion(.failure(NSError(domain: "InvalidURL", code: 0)))
        return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "PUT"
    request.setValue("AppendBlob", forHTTPHeaderField: "x-ms-blob-type")
    request.setValue("2021-10-04", forHTTPHeaderField: "x-ms-version")

    URLSession.shared.dataTask(with: request) { _, response, error in
        if let error = error { completion(.failure(error)); return }

        guard let http = response as? HTTPURLResponse else {
            completion(.failure(NSError(domain: "NoResponse", code: 0)))
            return
        }

        guard (200...299).contains(http.statusCode) else {
            completion(.failure(NSError(domain: "AzureError", code: http.statusCode)))
            return
        }

        completion(.success(()))
    }.resume()
}


func appendTextToAppendBlob(
    accountName: String,
    containerName: String,
    blobName: String,
    sasToken: String,
    text: String,
    completion: @escaping (Result<Void, Error>) -> Void
) {
    let urlString = "https://\(accountName).blob.core.windows.net/\(containerName)/\(blobName)?comp=appendblock&\(sasToken)"
    guard let url = URL(string: urlString),
          let data = text.data(using: .utf8) else {
        completion(.failure(NSError(domain: "InvalidData", code: 0)))
        return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "PUT"
    request.httpBody = data
    request.setValue("text/csv", forHTTPHeaderField: "Content-Type")
    request.setValue(String(data.count), forHTTPHeaderField: "Content-Length")
    request.setValue("2021-10-04", forHTTPHeaderField: "x-ms-version")

    URLSession.shared.dataTask(with: request) { _, response, error in
        if let error = error { completion(.failure(error)); return }

        guard let http = response as? HTTPURLResponse else {
            completion(.failure(NSError(domain: "NoResponse", code: 0)))
            return
        }

        guard (200...299).contains(http.statusCode) else {
            completion(.failure(NSError(domain: "AzureError", code: http.statusCode)))
            return
        }

        completion(.success(()))
    }.resume()
}






class PopupController: ObservableObject {
    @Published var showPopup: Bool = false
    @Published var message: String = ""
}

struct PopupNotification: View {
    @Binding var isVisible: Bool
    let message: String
    var body: some View {
        ZStack(alignment: .trailing) {
            if isVisible {
                HStack {
                    Image(systemName: "bell")
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .cornerRadius(12)
                        .shadow(radius: 5)
                        .padding(.trailing, 20)
                    Text(message)
                        .font(.headline)
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .cornerRadius(12)
                        .shadow(radius: 5)
                        .padding(.trailing, 20)
                }
                .background(LinearGradient(gradient: Gradient(colors: [Color.customForegroundGold, Color.customBackgroundGray]), startPoint: .leading, endPoint: .trailing))
                .transition(.move(edge: .trailing).combined(with: .opacity))
                .animation(.spring(response: 0.5, dampingFraction: 0.8), value: isVisible)
            }
        }
        .onChange(of: isVisible) { newValue in
            if newValue {
                DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                    withAnimation {
                        isVisible = false
                    }
                }
            }
        }
    }
}



func promptSwitcher(area: String) -> String {
    var prompt: String = ""
    switch area {
    case "Offense":
        prompt = """
You are a former professional Clash Royale esports player and coach.
Generate a deck report in that follows the example JSON response from the attached context exactly.

    "Offense": {
      "Score": 0.0,
      "Summary": "string",
      "Roles": {
        "Win Conditions": {
          "Score": 0.0,
          "Summary": "string",
          "Cards": ["CardName1", "CardName2"]
        },
        "Offensive Support": { ...same structure... },
        "Big Damage Spells": { ...same structure... },
        "Small Damage Spells": { ...same structure... },
        "Bridge Pressure": { ...same structure... },
        "Pump Responses": { ...same structure... },
        "Chip Damage": { ...same structure... }
      }
    }

Rules:
- Each role must include: "Score" (float), "Summary" (string), and "Cards" (array of card names).
- All scores out of 5.0 to one decimal place.
- The roles must remain in the order in which they appear above (i.e., win conditions, then offensive support, and so on).
- Do not output any text outside the JSON.
"""
        
    case "Defense": 
        prompt = """
        You are a former professional Clash Royale esports player and coach.
        Generate a deck report in that follows the example JSON response from the attached context exactly.
            "Defense": {
              "Score": 0.0,
              "Summary": "string",
              "Roles": {
                        "Air Defense": {
                          "Score": 0.0,
                          "Summary": "string",
                          "Cards": ["CardName1", "CardName2"]
                        },
                "Crowd Control": { ...same structure... },
                "Mini Tank": { ...same structure... },
                "Buildings": { ...same structure... },
                "Reset Mechanics": { ...same structure... },
                "Tank Killer": { ...same structure... },
                "Control Stall": { ...same structure... },
                "Cycle Cards": { ...same structure... },
                "Investments": { ...same structure... },
                "Swarm Units": { ...same structure... },
                "Spell Bait": { ...same structure... }
              }
            }
        Rules:
        - Each role must include: "Score" (float), "Summary" (string), and "Cards" (array of card names).
        - All scores out of 5.0 to one decimal place.
        - The roles must remain in the order in which they appear above (i.e., crowd control, then mini tank, and so on).
        - Do not output any text outside the JSON.
        """
    case "Synergy":
        prompt = """
        You are a former professional Clash Royale esports player and coach.
        Generate a deck report in that follows the example JSON response from the attached context exactly.
        "Synergy": {
            "Score": 0.0,
            "Summary": "string",
        "Combos": {
                "Offensive Combos": {
                    "Score": 0.0,
                    "Summary": "string",
                    "Cards": ["CardName1", "CardName2"]
                                    },
                "Defensive Combos": { ...same structure...}
        
        
                  }
            }
        Rules:
        - Each combo category must include: "Score" (float), "Summary" (string), and "Cards" (array of card names).
        - All scores out of 5.0 to one decimal place.
        - Do not output any text outside the JSON.
        """
        
    case "Versatility":
        prompt = """
                    "Versatility": {
                      "Score": 0.0,
                      "Summary": "string",
                      "Archetypes": {
                        "Versus Beatdown 🪖": {
                          "Score": 0.0,
                          "Description": "string"
                        },
                        "Versus Bridge Spam 🚨": { ...same structure... },
                        "Versus Siege 🏰": { ...same structure... },
                        "Versus Bait 🪝": { ...same structure... },
                        "Versus Cycle ♻️": { ...same structure... },
                        "Versus Royal Giant 💣": { ...same structure... },
                        "Versus Graveyard ☠️": { ...same structure... }
                      }
                    }
                  }
                }

                Rules:
                - Do not output any text outside the JSON.
                - All scores out of 5.0 to one decimal place.
                """
    default:
        prompt = "None"
        
    }
    
    return prompt
}



func averageScore(scores: [Double]) -> Double{
    var totalScore: Double = 0
    for score in scores {
        totalScore += score
    }
    return totalScore / Double(scores.count)
}



func letterGrade(score: Double) -> some View {
    switch score {
    case ..<1.0:
        Text("F")
            .fontWeight(.bold)
            .foregroundColor(Color.red)
    case 1.0..<1.4:
        Text("D-")
            .fontWeight(.bold)
            .foregroundColor(Color.orange)
    case 1.4..<1.7:
        Text("D")
            .fontWeight(.bold)
            .foregroundColor(Color.orange)
    case 1.7..<2.0:
        Text("D+")
            .fontWeight(.bold)
            .foregroundColor(Color.orange)
    case 2.0..<2.3:
        Text("C-")
            .fontWeight(.bold)
            .foregroundColor(Color.yellow)
    case 2.3..<2.7:
        Text("C")
            .fontWeight(.bold)
            .foregroundColor(Color.yellow)
    case 2.7..<3.0:
        Text("C+")
            .fontWeight(.bold)
            .foregroundColor(Color.yellow)
    case 3.0..<3.3:
        Text("B-")
            .fontWeight(.bold)
            .foregroundColor(Color.green)
    case 3.3..<3.7:
        Text("B")
            .fontWeight(.bold)
            .foregroundColor(Color.green)
    case 3.7..<4.0:
        Text("B+")
            .fontWeight(.bold)
            .foregroundColor(Color.green)
    case 4.0..<4.3:
        Text("A-")
            .fontWeight(.bold)
            .foregroundColor(Color.purple)
    case 4.3..<4.7:
        Text("A")
            .fontWeight(.bold)
            .foregroundColor(Color.purple)
    case 4.7...5.0:
        Text("A+")
            .fontWeight(.bold)
            .foregroundColor(Color.purple)
    default:
        Text("No score given or score out of range")
    }
}

func roleView(name: String, score: Double, summary: String, cards: [String]) -> some View {
    VStack {
        HStack {
            VStack(alignment: .leading) {
                Text(name)
                    .foregroundColor(.customForegroundGold)
                    .padding(.horizontal, 2)
                    .fontWeight(.light)
            }
            .padding(.vertical, 4)
            VStack(alignment: .leading) {
                letterGrade(score: score)
                    .foregroundColor(.customForegroundGold)
                    .padding(.horizontal, 2)
                    .fontWeight(.light)
            }
            .padding(.vertical, 4)
            Spacer()
        }
        HStack {
            ForEach(cards, id: \.self) { card in
                let urlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(apiToName(api: card)).png"
                if let url = URL(string: urlString) {
                    AsyncImage(url: url) { image in
                        image.resizable().scaledToFit().cornerRadius(8).shadow(radius: 4)
                    } placeholder: {
                        ProgressView()
                    }
                    .frame(height: 90)
                }
            }
        }
        Text(summary)
            .foregroundColor(.white)
            .font(.system(size: 12, weight: .light))
            .multilineTextAlignment(.leading)
            .lineLimit(nil)                                // allow wrapping
            .fixedSize(horizontal: false, vertical: true)  // grow vertically, don't truncate
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading) // give it width to wrap
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.black)
            )


    }
}




func ArchetypeView(name: String, score: Double, description: String) -> some View {
    VStack {
        HStack {
            VStack(alignment: .leading) {
                Text(name)
                    .foregroundColor(.customForegroundGold)
                    .padding(.horizontal, 2)
                    .fontWeight(.light)
            }
            
            .padding(.vertical, 4)
            VStack(alignment: .leading) {
                letterGrade(score: score)
                    .foregroundColor(.customForegroundGold)
                    .padding(.horizontal, 2)
                    .fontWeight(.light)
            }
            .padding(.vertical, 4)
            Spacer()
        }
        Text(description)
            .foregroundColor(.white)
            .font(.system(size: 12, weight: .light))
            .multilineTextAlignment(.leading)
            .lineLimit(nil)                                // allow wrapping
            .fixedSize(horizontal: false, vertical: true)  // grow vertically, don't truncate
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading) // give it width to wrap
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.black)
            )
    }
}



struct ChatMessage: Codable {
    let role: String
    let content: String
}

struct ChatRequest: Encodable {
    let model: String
    let messages: [ChatMessage]
    let response_format: [String: String]? // 👈 Add this
    let max_completion_tokens: Int
}


struct ChatResponse: Decodable {
    struct Choice: Decodable {
        struct Message: Decodable {
            let role: String
            let content: Content
        }
        let message: Message
    }
    let choices: [Choice]

    struct Content: Decodable {
        let stringValue: String?

        init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            if let s = try? container.decode(String.self) {
                stringValue = s
            } else if let dict = try? container.decode([String: AnyDecodable].self) {
                // Convert dictionary back into JSON string
                let data = try JSONEncoder().encode(dict)
                stringValue = String(data: data, encoding: .utf8)
            } else {
                stringValue = nil
            }
        }
    }
}

// Helper to decode arbitrary JSON values
struct AnyDecodable: Decodable, Encodable {
    let value: Any

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let intVal = try? container.decode(Int.self) { value = intVal; return }
        if let dblVal = try? container.decode(Double.self) { value = dblVal; return }
        if let boolVal = try? container.decode(Bool.self) { value = boolVal; return }
        if let strVal = try? container.decode(String.self) { value = strVal; return }
        if let arrVal = try? container.decode([AnyDecodable].self) { value = arrVal; return }
        if let dictVal = try? container.decode([String: AnyDecodable].self) { value = dictVal; return }
        throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported type")
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let intVal = value as? Int { try container.encode(intVal); return }
        if let dblVal = value as? Double { try container.encode(dblVal); return }
        if let boolVal = value as? Bool { try container.encode(boolVal); return }
        if let strVal = value as? String { try container.encode(strVal); return }
        if let arrVal = value as? [AnyDecodable] { try container.encode(arrVal); return }
        if let dictVal = value as? [String: AnyDecodable] { try container.encode(dictVal); return }
        throw EncodingError.invalidValue(value, EncodingError.Context(codingPath: container.codingPath, debugDescription: "Unsupported type"))
    }
}









func fastestCycle(deck: Deck, externalData: ExternalData) -> Int {
    let deckCardsSorted: [(key: String, value: Mapping)] = externalData.cards.filter( {deck.cards.contains($0.value.cardName)}).sorted {$0.value.elixirCost <= $1.value.elixirCost}
    var totalElixir: Int = 0
    for card in deckCardsSorted.prefix(4) {
        totalElixir += card.value.elixirCost
    }
    return totalElixir
    }

/*

func fastestCycleCards(cards: [String], externalData: ExternalData) -> some View {
    let deckCardsSorted: [(key: String, value: Mapping)] = externalData.cards.filter( {deckToAnalyze.cards.contains($0.value.cardName)}).sorted{$0.value.elixirCost <= $1.value.elixirCost}
    return HStack {
        ForEach(deckCardsSorted.prefix(4), id: \.key) { _, details in
        let urlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(details.apiName).png"
        if let url = URL(string: urlString) {
            AsyncImage(url: url) { image in
                image.resizable().scaledToFit().cornerRadius(8).shadow(radius: 4)
            } placeholder: {
                ProgressView()
            }
            .frame(height: 90)
        }
    }
    }
}
 
 */
 
func averageElixir(deck: Deck, externalData: ExternalData) -> Float {
    var totalElixir: Int = 0
    
    for card in externalData.cards.filter({ deck.cards.contains($0.value.cardName) }) {
        totalElixir += card.value.elixirCost
    }
    
    let rawValue = Float(totalElixir) / 8
    let rounded = (rawValue * 10).rounded(.toNearestOrAwayFromZero) / 10
    
    return rounded
}

 

//Context
let context = PersistenceController.shared.container.viewContext

// Custom Colors
extension Color {
    static let customBackgroundGray = Color(red: 0.2157, green: 0.2157, blue: 0.2157)
    static let customForegroundGold = Color(red: 0.8471, green: 0.6902, blue: 0.4039)
}

func cardsWithTag(tag: String, externalData: ExternalData, deckToAnalyze: Deck, badIfNone: Bool) -> some View {
    Group {
        if externalData.cards.contains(where: { deckToAnalyze.cards.contains($0.key) && $0.value.tags.contains(tag) }) {
            ScrollView {
                HStack {
                    ForEach(Array(externalData.cards.filter({ deckToAnalyze.cards.contains($0.key) && $0.value.tags.contains(tag) })), id: \.key) { _, details in
                        let urlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(details.apiName).png"
                        if let url = URL(string: urlString) {
                            AsyncImage(url: url) { image in
                                image.resizable().scaledToFit().cornerRadius(8).shadow(radius: 4)
                            } placeholder: {
                                ProgressView()
                            }
                            .frame(height: 90)
                        }
                    }
                }
            }
        } else if badIfNone == true {
            ZStack {
                Rectangle()
                    .fill(Color.red.opacity(0.1))
                    .padding(.horizontal, 16)
                    .cornerRadius(10)
                VStack {
                    Text("Missing")
                        .foregroundColor(Color.white)
                    Image(systemName: "exclamationmark.triangle")
                        .foregroundColor(Color.white)
                }
                .padding(.vertical, 16)
            }
        }
        else {
            ZStack {
                Rectangle()
                    .fill(Color.green.opacity(0.1))
                    .padding(.horizontal, 16)
                    .cornerRadius(10)
                VStack {
                    Text("None")
                        .foregroundColor(Color.white)
                    Image(systemName: "checkmark.circle")
                        .foregroundColor(Color.white)
                }
                .padding(.vertical, 16)
            }
        }
    }
}


//Core Data functions
func fetchCategories() -> [FavCat] {
    let context = PersistenceController.shared.container.viewContext
    let request: NSFetchRequest<FavCat> = FavCat.fetchRequest()
    request.sortDescriptors = [NSSortDescriptor(keyPath: \FavCat.name, ascending: true)]
    
    do {
        let results = try context.fetch(request)
        if results.count >= 1 {
            return results
        } else {
            return []
        }
    } catch {
        print("❌ Error fetching: \(error.localizedDescription)")
        return []
    }
}

func fetchDecks() -> [FavDeck] {
    let context = PersistenceController.shared.container.viewContext
    let request: NSFetchRequest<FavDeck> = FavDeck.fetchRequest()
    request.sortDescriptors = [NSSortDescriptor(keyPath: \FavDeck.name, ascending: true)]
    
    do {
        return try context.fetch(request)
    } catch {
        print("❌ Error fetching: \(error.localizedDescription)")
        return []
    }
}

func deleteDeck(deck: FavDeck) {
    let context = PersistenceController.shared.container.viewContext
    context.delete(deck)
    do {
        try context.save()
    } catch {
        print("Error deleting item: \(error.localizedDescription)")
    }
    
}

struct report {
    var deck: String
    var offense: String
    var defense: String
    var synergy: String
    var versatility:String
}

//CSVLoader
class CSVLoader {
    static func loadDecks(from decksURL: String) throws -> [Deck] {
        guard let url = URL(string: decksURL) else {
            throw URLError(.badURL)
        }
        
        let data = try Data(contentsOf: url)
        
        guard let content = String(data: data, encoding: .utf8) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        let rows = content.components(separatedBy: "\n").dropFirst()
        var decks: [Deck] = []
        
        for row in rows {
            let columns = row.components(separatedBy: ",")
            if columns.count < 2 { continue }
            if let deckId = Int(columns[0]) {
                // take only the second column as the card list
                let cardListString = columns[1].trimmingCharacters(in: .whitespacesAndNewlines)
                
                let cardNames = cardListString
                    .components(separatedBy: ";") // or "," depending on your file format
                    .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                    .filter { !$0.isEmpty }
                
                let deck = Deck(id: deckId, cards: cardNames)
                decks.append(deck)                }
            
            
        }
        return decks
    }
    
    static func loadReports(from reportsURL: String) throws -> [report] {
        guard let url = URL(string: reportsURL) else {
            throw URLError(.badURL)
        }
        
        let data = try Data(contentsOf: url)
        
        guard let content = String(data: data, encoding: .utf8) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        let rows = content.components(separatedBy: "\n").dropFirst()
        var reports: [report] = []
        for row in rows {
            let columns = row.components(separatedBy: ",")
            guard columns.count >= 5 else { continue }
            let deck = columns[0].trimmingCharacters(in: .whitespacesAndNewlines)
            let offense = columns[1].trimmingCharacters(in: .whitespacesAndNewlines)
            let defense = columns[2].trimmingCharacters(in: .whitespacesAndNewlines)
            let synergy = columns[3].trimmingCharacters(in: .whitespacesAndNewlines)
            let versatility = columns[4].trimmingCharacters(in: .whitespacesAndNewlines)
            let report = report(deck: deck, offense: offense, defense: defense, synergy: synergy, versatility: versatility)
            reports.append(report)
        }
        return reports
    }
    
    static func loadCardMapping(from cardsURL: String) throws -> [String: Mapping] {
        guard let url = URL(string: cardsURL) else {
            throw URLError(.badURL)
        }

        let data = try Data(contentsOf: url)

        guard let content = String(data: data, encoding: .utf8) else {
            throw URLError(.cannotDecodeContentData)
        }

        let rows = content.components(separatedBy: "\n").dropFirst()
        var mapping: [String: Mapping] = [:]

        for row in rows {
            let columns = row.components(separatedBy: ",")
            guard columns.count >= 7 else { continue }

            let cardName = columns[0].trimmingCharacters(in: .whitespacesAndNewlines)
            let apiName = columns[1].trimmingCharacters(in: .whitespacesAndNewlines)
            let elixirCost = Int(columns[3].trimmingCharacters(in: .whitespacesAndNewlines)) ?? 0
            let arena = Int(columns[4].trimmingCharacters(in: .whitespacesAndNewlines)) ?? 0
            let rarity = Int(columns[5].trimmingCharacters(in: .whitespacesAndNewlines)) ?? 0
            let tags = columns[6]
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .components(separatedBy: ";")
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }


            mapping[cardName] = Mapping(
                cardName: cardName,
                apiName: apiName,
                elixirCost: elixirCost,
                arena: arena,
                rarity: rarity,
                tags: tags
            )
        }

        return mapping
    }



    static func loadFeatures(from featuresURL: String) throws -> [feature] {
        guard let url = URL(string: featuresURL) else {
            throw URLError(.badURL)
        }
        
        let data = try Data(contentsOf: url)

        guard let content = String(data: data, encoding: .utf8) else {
            throw URLError(.cannotDecodeContentData)
        }
        
        let rows = content.components(separatedBy: "\n").dropFirst()
        var features: [feature] = []
        
        for row in rows {
            let columns = row.components(separatedBy: ",")
            if columns.count < 2 { continue }
            let featuredText = columns[0].trimmingCharacters(in: .whitespacesAndNewlines)
            let featuredImage = columns[1].trimmingCharacters(in: .whitespacesAndNewlines)
            let color = columns[2].trimmingCharacters(in: .whitespacesAndNewlines)
            let featuredOptions = columns[3].trimmingCharacters(in: .whitespacesAndNewlines).components(separatedBy: ",")
            let featuredType = columns[4].trimmingCharacters(in: .whitespacesAndNewlines)
            let featureEntry = feature(featuredText: featuredText, featuredType: featuredType, color: color, featuredImage: featuredImage, featuredOptions: featuredOptions)
            features.append(featureEntry)
        }
        
        return features
                
    }
}


struct feature {
    let featuredText: String
    let featuredType: String
    let color: String
    let featuredImage: String
    let featuredOptions: [String]
}


//Clash Royale API <-> RoyaleAPI conversion functions
func nameToApi (name: String) -> String {
    if name == "pekka" {
        return "P.E.K.K.A"
    }
    else if name == "mini-pekka" {
        return "Mini P.E.K.K.A"
    }
    else if name == "x-bow" {
        return "X-bow"
    }
    else {
        return name.replacingOccurrences(of: "-", with: " ").capitalized
    }
    
}

func apiToName (api: String) -> String {
    if api == "P.E.K.K.A" {
        return "pekka"
    }
    else if api == "Mini P.E.K.K.A" {
        return "mini-pekka"
    }
    else if api == "X-bow" {
        return "x-bow"
    }
    else {
        return api.replacingOccurrences(of: " ", with: "-").lowercased()
    }
}

func towerTroopName(name: String) -> String {
    return name.replacingOccurrences(of: "_", with: "-")
}


//Banners for features and favourite categories
func categoryBanner(name: String, color: String, icon: String, updateFavs: updateFavourites, externalData: ExternalData) -> some View {
    var selectedColor: Color
    switch color {
    case "Red":
        selectedColor = Color.red
    case "Blue":
        selectedColor = Color.blue
    case "Green":
        selectedColor = Color.green
    case "Yellow":
        selectedColor = Color.yellow
    case "Gray":
        selectedColor = Color.gray
    case "Purple":
        selectedColor = Color.purple
    case "Brown":
        selectedColor = Color.brown
    default:
        selectedColor = Color.customForegroundGold
    }
    
    return ZStack {
        Rectangle()
            .fill(LinearGradient(
                gradient: Gradient(colors: [selectedColor, .customBackgroundGray]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ))
            .frame(height: 100)
        HStack {
            VStack {
                Text(name)
                    .foregroundStyle(Color.customBackgroundGray)
                    .fontWeight(.bold)
                    .padding(.bottom, 16)
                    .padding(.horizontal, 16)
                if name != "Uncategorized" {
                    NavigationLink(destination: CategoryDecksView(externalData: externalData, updateFavs: updateFavs, filterOptions: name)) {
                        HStack {
                            Text("See All")
                                .foregroundColor(.customBackgroundGray)
                            Image(systemName: "arrow.right")
                                .foregroundColor(.customBackgroundGray)
                        }
                        .padding(.horizontal, 16)
                    }
                }
            }
            Spacer()
            if icon != "none" {
                Image(icon)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 100, height: 100)
                    .padding(.horizontal, 16)
            }
        }
    }
}

func featuredBanner(featuredText: String, featruedType: String, color: String, featuredImage: String, filterOptions: [String], updateFavs: updateFavourites, viewModel: CardSelectionViewModel, externalData: ExternalData) -> some View {
    var selectedColor: Color
    switch color {
    case "Red":
        selectedColor = Color.red
    case "Blue":
        selectedColor = Color.blue
    case "Green":
        selectedColor = Color.green
    case "Yellow":
        selectedColor = Color.yellow
    case "Gray":
        selectedColor = Color.gray
    case "Purple":
        selectedColor = Color.purple
    case "Brown":
        selectedColor = Color.brown
    case "Gold":
        selectedColor = Color.customForegroundGold
    case "Pink":
        selectedColor = Color.pink
    default:
        selectedColor = Color.customForegroundGold
    }
    
    return  ZStack {
        Rectangle()
            .fill(LinearGradient(
                gradient: Gradient(colors: [selectedColor, .customBackgroundGray]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ))
            .frame(height: 100)
        HStack {
            VStack {
                if featuredText != "Top Decks" {
                    Text(featruedType)
                        .foregroundStyle(Color.customBackgroundGray)
                        .padding(.top, 16)
                    Text(featuredText)
                        .font(.system(size: 24, weight: .medium))
                        .padding(.horizontal, 16)
                        .foregroundStyle(Color.customBackgroundGray)
                    Spacer()
                    
                    NavigationLink(destination: FeaturedDecksView(externalData: externalData, viewModel: viewModel, name: featuredText, filterOptions: filterOptions, updateFavs: updateFavs)) {
                            HStack {
                                Text("See All")
                                    .foregroundColor(.customBackgroundGray)
                                Image(systemName: "arrow.right")
                                    .foregroundColor(.customBackgroundGray)
                            }
                            .padding(.horizontal, 16)
                            .padding(.bottom, 16)
                        }

                }
                else {
                    Text(featuredText)
                        .font(.system(size: 24, weight: .medium))
                        .padding(.horizontal, 16)
                        .padding(.top, 16)
                        .foregroundStyle(Color.customBackgroundGray)
                    Text("The most popular decks right now")
                        .foregroundStyle(Color.customBackgroundGray)
                        .padding(.vertical, 8)
                        .padding(.horizontal, 8)
                    Spacer()
                }
                
                
            }
            Spacer()
            let urlString = featuredImage
            if let url = URL(string: urlString) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .scaledToFit()
                        .cornerRadius(8)
                        .shadow(radius: 4)
                } placeholder: {
                    ProgressView()
                }
                .frame(height: 120)
                }
        }
    }
}





struct Deck: Identifiable {
    let id: Int
    let cards: [String] // these are card_name
}

func deckGrid(deck: Deck, cardMap: [String: Mapping], columns: [GridItem]) -> some View {
    LazyVGrid(columns: columns, spacing: 0) {
        ForEach(Array(deck.cards.enumerated()), id: \.element) { index, cardName in
            let cardIndex = index + 1

            if let localImage = UIImage(named: cardName) {
                Image(uiImage: localImage)
                    .resizable()
                    .scaledToFit()
                    .cornerRadius(8)
                    .shadow(radius: 4)
                    .frame(height: 120)
            } else if let royaleapiName = cardMap[cardName]?.apiName {
                let ev1UrlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(royaleapiName)-ev1.png"
                let heroUrlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(royaleapiName)-hero.png"
                let fallbackUrlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(royaleapiName).png"
                let primaryUrl: URL?
                if cardIndex <= 2 {
                    primaryUrl = URL(string: ev1UrlString)
                } else if cardIndex <= 4 {
                    primaryUrl = URL(string: heroUrlString)
                } else {
                    primaryUrl = URL(string: fallbackUrlString)
                }
                let fallbackUrl = URL(string: fallbackUrlString)

                if let url = primaryUrl {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFit()
                                .cornerRadius(8)
                                .shadow(radius: 4)
                        case .failure:
                            if let fallbackUrl {
                                AsyncImage(url: fallbackUrl) { fallbackPhase in
                                    switch fallbackPhase {
                                    case .success(let fallbackImage):
                                        fallbackImage
                                            .resizable()
                                            .scaledToFit()
                                            .cornerRadius(8)
                                            .shadow(radius: 4)
                                    default:
                                        ProgressView()
                                    }
                                } placeholder: {
                                    ProgressView()
                                }
                            } else {
                                ProgressView()
                            }
                        default:
                            ProgressView()
                        }
                    }
                    .frame(height: 120)
                }
            } else {
                Color.gray
                    .overlay(Text(cardName).foregroundColor(.white))
                    .cornerRadius(8)
                    .frame(height: 120)
            }
        }
    }
}



struct Mapping {
    let cardName: String
    let apiName: String
    let elixirCost: Int
    let arena: Int
    let rarity: Int
    let tags: [String]
}


class updateFavourites: ObservableObject {
    @Published var updateVar: Int = 0
}


class DeckToEdit: ObservableObject {
    @Published var name: String = ""
    @Published var cards: [String] = []
    @Published var category: String = ""
}


class CardSelectionViewModel: ObservableObject {
    @Published var includedCardsAPIName: Set<String> = []
    @Published var discludedCardsAPIName: Set<String> = []
    @Published var includedCardsName: Set<String> = []
    @Published var discludedCardsName: Set<String> = []
}


class filterOptions: ObservableObject {
    @Published var name: String = ""
    @Published var filteredCards: [String] = []
}

struct CardButton: View {
    let cardName: String
    let apiName: String
    let isIncluded: Bool
    let isDiscluded: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            ZStack {
                let urlString = "https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/\(apiName).png"
                if let url = URL(string: urlString) {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .scaledToFit()
                            .cornerRadius(8)
                            .shadow(radius: 4)
                    } placeholder: {
                        ProgressView()
                    }
                    .frame(height: 120)
                    }
                
                if isIncluded {
                    Color.green.opacity(0.4)
                        .cornerRadius(12)
                }
                if isDiscluded {
                    Color.red.opacity(0.4)
                        .cornerRadius(12)
                }
            }
        }
    }
}


class ExternalData: ObservableObject {
    @Published var cards: [String: Mapping]
    @Published var decks: [Deck]
    @Published var features: [feature]
    
    init(cardsURL: String, decksURL: String, featuresURL: String)  {
        do {
            self.decks = try CSVLoader.loadDecks(from: decksURL)
            self.features = try CSVLoader.loadFeatures(from: featuresURL)
            self.cards = try CSVLoader.loadCardMapping(from: cardsURL)
        } catch {
            print("Failed to load external data")
            self.decks = []
            self.features = []
            self.cards = [:]
        }
    }
}




