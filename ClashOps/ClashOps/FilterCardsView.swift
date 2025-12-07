//
//  FilterCardsView.swift
//  ClashOps
//
//  Created by Matthew Riley on 2025-09-09.
//


// MARK: Imports
import SwiftUI

struct FilterCardsView: View {
    
    //MARK: Variable declatations
    @State private var sortMode: Int = 3
    @Environment(\.dismiss) private var dismiss
    
    @ObservedObject var externalData: ExternalData
    
    @Binding var includedCardsAPIName: Set<String>
    @Binding var discludedCardsAPIName: Set<String>
    @Binding var includedCardsName: Set<String>
    @Binding var discludedCardsName: Set<String>
 //   @ObservedObject var path: pathClass
    let columns = fiveColumnGrid
    
    var sortedCards: [(key: String, value: Mapping)] {
        var base = Array(externalData.cards).sorted { $0.key < $1.key }
        switch sortMode {
        case 1:
            base = base.sorted { $0.value.elixirCost <= $1.value.elixirCost}
        case 2:
            base = base.sorted { $0.value.arena <= $1.value.arena}
        case 3:
            base = base.sorted { $0.value.rarity <= $1.value.rarity}
        default:
            break
        }
        return base
    }
    
    var sortLabel: String {
        var label = "Sorted by "
        switch sortMode {
        case 1:
            label = label + "Elixir Cost"
        case 2:
            label = label + "Arena"
        case 3:
            label = label + "Rarity"
        default:
            label = label + "Name"
        }
        return label
    }
    
    var body: some View {
        ZStack {
            Color.customBackgroundGray.ignoresSafeArea()
            //Back button
            VStack {
                HStack {
                   Button(action: {
                       dismiss()
                    }) {
                        HStack {
                            Image(systemName: "arrow.left")
                                .foregroundColor(.customForegroundGold)
                                .padding(.horizontal, 16)
                            Text("Back")
                                .foregroundColor(.customForegroundGold)
                            Spacer()
                        }
                    }
                }
                
                Text("Toggle cards to include/discude them in your deck search.")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.customForegroundGold)
                    .padding(.top, 2)
                    .padding(.bottom, 2)
                
                HStack {
                    Button(action: {
                        includedCardsName = []
                        discludedCardsName = []
                        includedCardsAPIName = []
                        discludedCardsAPIName = []
                        
                    }) {
                        Text("Clear Filters")
                            .foregroundColor(.customForegroundGold)
                        Image(systemName: "xmark")
                            .foregroundColor(.customForegroundGold)
                            .padding(.trailing, 8)
                    }
                    //Toggle sort mode button
                    Button(action: {
                        sortMode = (sortMode + 1) % 4
                    }) {
                        Text(sortLabel)
                            .foregroundColor(.customForegroundGold)
                        Image(systemName: "arrow.up.arrow.down")
                            .foregroundColor(.customForegroundGold)
                    }
                }
                
                //MARK: Cards
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 1) {
                        ForEach(sortedCards, id: \.key) { cardName, details in
                            CardButton(cardName: cardName, apiName: details.apiName, isIncluded: includedCardsAPIName.contains(details.apiName), isDiscluded: discludedCardsAPIName.contains(details.apiName)) {
                                if includedCardsAPIName.contains(details.apiName) {
                                    includedCardsAPIName.remove(details.apiName)
                                    includedCardsName.remove(details.cardName)
                                    discludedCardsAPIName.insert(details.apiName)
                                    discludedCardsName.insert(details.cardName)
                                } else if discludedCardsAPIName.contains(details.apiName) {
                                    discludedCardsAPIName.remove(details.apiName)
                                    discludedCardsName.remove(details.cardName)
                                } else {
                                    includedCardsAPIName.insert(details.apiName)
                                    includedCardsName.insert(details.cardName)
                                }
                            }
                            }
                        }
                    }
                }
            }.navigationBarBackButtonHidden(true)
        }
    }

#Preview {
    FilterCardsView(externalData: ExternalData(cardsURL: cardsURL, decksURL: decksURL, featuresURL: featuresURL), includedCardsAPIName: .constant([]), discludedCardsAPIName: .constant([]), includedCardsName: .constant([]), discludedCardsName: .constant([]))
}
