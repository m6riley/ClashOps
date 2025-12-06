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
    @State private var sortMode: SortMode = .rarity
    @Environment(\.dismiss) private var dismiss
    
    @ObservedObject var externalData: ExternalData
    
    @Binding var includedCardsAPIName: Set<String>
    @Binding var discludedCardsAPIName: Set<String>
    @Binding var includedCardsName: Set<String>
    @Binding var discludedCardsName: Set<String>
 //   @ObservedObject var path: pathClass
    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())

    ]
    
    var sortedCards: [(key: String, value: Mapping)] {
        Array(externalData.cards).sorted(by: sortMode.comparator)
    }

    var sortLabel: String {
        "Sorted by \(sortMode.label)"
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
                        sortMode = sortMode.next
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
