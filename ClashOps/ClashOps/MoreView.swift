//
//  MoreView.swift
//  ClashOps
//
//  Created by Matthew Riley on 2025-10-17.
//

import SwiftUI

struct MoreView: View {
    
    @State var email: String = "Enter your email here"
    @State var message: String = "Enter your message here"
    
    var body: some View {
        ZStack {
            Color.customBackgroundGray.ignoresSafeArea()
            VStack {
                // MARK: Header
                VStack(spacing: 0) {
                    Text("About")
                        .font(.system(size: 36, weight: .medium))
                        .foregroundColor(.customForegroundGold)
                        .padding(.top, 16)
                    HStack(spacing: 0) {
                        Rectangle()
                            .fill(Color.customForegroundGold)
                            .frame(height: 1)
                        Image("Logo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 100, height: 100)
                        Rectangle()
                            .fill(Color.customForegroundGold)
                            .frame(height: 1)
                    }
                }
                ScrollView {
                    HStack {
                        Text("About ClashOps Diamond")
                            .foregroundStyle(gradientBlueTeal)
                            .padding(.top, 16)
                            .padding(.leading, 16)
                        Spacer()
                    }
                    
                    HStack {
                        VStack {
                            Rectangle()
                                .fill(gradientBlueTeal)
                                .frame(width: 1, height: 55)
                                .padding(.horizontal, 8)
                            Image(systemName: "diamond")
                                .foregroundStyle(gradientBlueTeal)
                            Rectangle()
                                .fill(gradientBlueTeal)
                                .frame(width: 1)
                                .padding(.horizontal, 8)
                        }
                        Spacer()
                        VStack {
                            Text("ClashOps Diamond grants access to the exclusive AI-powered features to further level-up your gameplay.")
                                .font(.system(size: 12, weight: .light))
                                .foregroundColor(.customForegroundGold)
                                .multilineTextAlignment(.center)
                                .padding(.vertical, 8)
                                .padding(.trailing, 16)
                            HStack {
                                Text("Deck Analysis")
                                    .font(.system(size: 12, weight: .light))
                                    .foregroundStyle(gradientBlueTeal)
                                    .padding(.vertical, 8)
                                    .padding(.trailing, 16)
                                    .underline()
                                Spacer()
                            }
                            Text("With deck analysis, any deck can be evaluated across a vareity of criterea. See you deck's defense coverage, offensive combos, how it performs against different archetypes, and much more. Deck analysis also recommends card swaps and evolutions to boost your deck's performance.")
                                .font(.system(size: 12, weight: .light))
                                .foregroundColor(.customForegroundGold)
                                .multilineTextAlignment(.center)
                                .padding(.vertical, 8)
                                .padding(.trailing, 16)
                        }
                    }
                    HStack {
                        Text("Socials, Events, and Promotions")
                            .foregroundColor(.customForegroundGold)
                            .padding(.top, 16)
                            .padding(.leading, 16)
                        Spacer()
                    }
                    Text("Coming Soon")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.customForegroundGold)
                        .multilineTextAlignment(.center)
                        .padding(.vertical, 8)
                    HStack {
                        Text("Disclaimers")
                            .foregroundColor(.customForegroundGold)
                            .padding(.top, 16)
                            .padding(.leading, 16)
                        Spacer()
                    }
                    Text("Affiliation With Supercell")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.customForegroundGold)
                        .padding(.vertical, 8)
                        .underline()
                    Text("ClashOps is an independent application and is not affiliated with, endorsed, sponsored, or specifically approved by Supercell. All trademarks and copyrights related to Clash Royale and Supercell are the property of Supercell. For more information about Supercell, please visit www.supercell.com.")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.customForegroundGold)
                        .multilineTextAlignment(.center)
                    Text("Affiliation With OpenAI")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.customForegroundGold)
                        .padding(.vertical, 8)
                        .underline()
                    Text("ClashOps is an independent application and is not affiliated with, endorsed, sponsored, or specifically approved by OpenAI. The application may utilize OpenAI’s technology or APIs to enhance user experience, but all trademarks and intellectual property related to OpenAI remain the property of OpenAI. For more information, visit www.openai.com.")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.customForegroundGold)
                        .multilineTextAlignment(.center)
                    Spacer()
                }
            }

        }
    }
}

#Preview {
    MoreView()
}
