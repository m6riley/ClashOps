//
//  DeckAnalysisView.swift
//  ClashOps
//
//  Created by Matthew Riley on 2025-09-26.
//

import SwiftUI

struct DeckAnalysisView: View {

    @State private var offense: Offense? = nil
    @State private var defense: Defense? = nil
    @State private var synergy: Synergy? = nil
    @State private var versatility: Versatility? = nil
    @State private var optimize: Optimize? = nil
    @State private var isLoading: String = "Analyzing Offense Potential"
    @State private var dropdowns: [Bool] = [false, false, false, false]
    @State private var isOptimized: String  = "no"
    @State private var percentLoading: Int = 0

    @Environment(\.dismiss) private var dismiss
    @ObservedObject var externalData: ExternalData
    
    @State private var offenseString: String = ""
    @State private var defenseString: String = ""
    @State private var synergyString: String = ""
    @State private var versatilityString: String = ""
    @State private var optimizeString: String = ""

    let deckToAnalyze: Deck

    var body: some View {
        ZStack {
            Color.customBackgroundGray.ignoresSafeArea()
            VStack {
                HeaderSection(dismiss: dismiss)
                contentView
            }
        }
        .task {
            let deckField: String = "[" + deckToAnalyze.cards.joined(separator: ",") + "]"

             do {
                 // Create report
                 try await createReport(deck: deckField)
                 
                 // Run analysis
                 try await analyzeDeck(deckToAnalyze: deckField, category: "offense")
                 isLoading = "Analyzing Defensive Potential"
                 percentLoading += 25
                 try await analyzeDeck(deckToAnalyze: deckField, category: "defense")
                 isLoading = "Analyzing Synergy"
                 percentLoading += 25
                 try await analyzeDeck(deckToAnalyze: deckField, category: "synergy")
                 isLoading = "Analyzing Versatility"
                 percentLoading += 25
                 try await analyzeDeck(deckToAnalyze: deckField, category: "versatility")
                 percentLoading += 25
                 isLoading = "None"
                
            } catch {
                print("❌ Deck analysis failed:", error)
            }
        }
        .navigationBarBackButtonHidden(true)
    }

    private var contentView: some View {
        Group {
            if isLoading == "None" {
                ScrollView {
                    MainAnalysisContent(
                        deck: deckToAnalyze,
                        externalData: externalData,
                        offense: offense,
                        defense: defense,
                        synergy: synergy,
                        versatility: versatility,
                        optimize: $optimize,
                        dropdowns: $dropdowns,
                        isOptimized: $isOptimized,
                        optimizeString: $optimizeString,
                        toggleDrop: toggleDropDowns
                    )
                }
            } else {
                LoadingSection(isLoading: isLoading, percentLoading: percentLoading)
            }
        }
    }

    private func createReport(deck: String) async throws {
        
        // Function URL
        let func_URL = URL(string: "https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/create_report?code=fQPVXDrG1jtqXxYiCQJoORCgESgAoZ4tC2HjgaIHoz1HAzFuox97Vw==")
        
        // Prepare request
        let payload = createReportRequest(deck: deck)
        var request = URLRequest(url: func_URL!)
        request.timeoutInterval = 9999  // seconds
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(payload)
        
        //Execute request
        let (data, response) = try await URLSession.shared.data(for: request)
        
        // Check status code
        if let httpResponse = response as? HTTPURLResponse {
            print("🔍 Status code:", httpResponse.statusCode)
            print("🔍 Response body:", String(data: data, encoding: .utf8) ?? "nil")
            
            guard (200...299).contains(httpResponse.statusCode) else {
                throw URLError(.badServerResponse)
            }
        }
        
    }

    
    
    

    
    // Returns true if all categories were decoded (i.e. report found in DB)
    private func analyzeDeck(deckToAnalyze: String, category: String) async throws {
        
        // Function URL
        let func_URL = URL(string: "https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/analyze_deck?code=7_jeBF2igCLBI7W7zE3oPnAg-dsDb813Ebtxl8Gr-I9XAzFuo3lS_g==")
        
        // Prepare request
        let payload = analysisRequest(deckToAnalyze: deckToAnalyze, category: category)
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
        switch decodedResponse.category {
        case "offense":
            let decodedCategoryData = try JSONDecoder().decode(Offense.self, from: categoryData!)
            self.offense = decodedCategoryData
            if let categoryData = categoryData {
                offenseString = String(data: categoryData, encoding: .utf8) ?? "nil"
                // use versatilityString here
            } else {
                offenseString = "nil"
                // handle the nil case here
            }
            print("Offense category decoded")
        case "defense":
            let decodedCategoryData = try JSONDecoder().decode(Defense.self, from: categoryData!)
            self.defense = decodedCategoryData
            if let categoryData = categoryData {
                defenseString = String(data: categoryData, encoding: .utf8) ?? "nil"
                // use versatilityString here
            } else {
                defenseString = "nil"
                // handle the nil case here
            }
            print("Defense category decoded")
        case "synergy":
            let decodedCategoryData = try JSONDecoder().decode(Synergy.self, from: categoryData!)
            self.synergy = decodedCategoryData
            if let categoryData = categoryData {
                synergyString = String(data: categoryData, encoding: .utf8) ?? "nil"
                // use versatilityString here
            } else {
                synergyString = "nil"
                // handle the nil case here
            }
            print("Synergy category decoded")
        case "versatility":
            let decodedCategoryData = try JSONDecoder().decode(Versatility.self, from: categoryData!)
            self.versatility = decodedCategoryData
            if let categoryData = categoryData {
                versatilityString = String(data: categoryData, encoding: .utf8) ?? "nil"
                // use versatilityString here
            } else {
                versatilityString = "nil"
                // handle the nil case here
            }
            print("Versatility category decoded")
        default:
            print("Default case returned")
        }

    }
    
    
    // MARK: - DROPDOWN TOGGLE
    private func toggleDropDowns(index: Int) {
        dropdowns[index].toggle()
    }
}

#Preview {
    DeckAnalysisView(
        externalData: ExternalData(cardsURL: cardsURL, decksURL: decksURL, featuresURL: featuresURL),
        deckToAnalyze: Deck(id: 0, cards: [])
    )
}
