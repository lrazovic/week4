import detectEthereumProvider from "@metamask/detect-provider";
import { Strategy, ZkIdentity } from "@zk-kit/identity";
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols";
import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useMemo, useState } from "react";
import { MyForm } from "../components/Form";
import Greeter from "artifacts/contracts/Greeters.sol/Greeters.json";
import { Text, Button, VStack, Flex, Box } from "@chakra-ui/react";

export default function Home() {
  const [logs, setLogs] = useState("Connect your wallet and greet!");
  const [greeting, setGreeting] = useState<string[]>([]);

  async function greet() {
    setLogs("Creating your Semaphore identity...");

    const provider = (await detectEthereumProvider()) as any;

    await provider.request({ method: "eth_requestAccounts" });

    const ethersProvider = new providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    const message = await signer.signMessage(
      "Sign this message to create your identity!"
    );

    const identity = new ZkIdentity(Strategy.MESSAGE, message);
    const identityCommitment = identity.genIdentityCommitment();
    const identityCommitments = await (
      await fetch("./identityCommitments.json")
    ).json();

    const merkleProof = generateMerkleProof(
      20,
      BigInt(0),
      identityCommitments,
      identityCommitment
    );

    setLogs("Creating your Semaphore proof...");

    const greeting = "Hello world";

    const witness = Semaphore.genWitness(
      identity.getTrapdoor(),
      identity.getNullifier(),
      merkleProof,
      merkleProof.root,
      greeting
    );

    const { proof, publicSignals } = await Semaphore.genProof(
      witness,
      "./semaphore.wasm",
      "./semaphore_final.zkey"
    );
    const solidityProof = Semaphore.packToSolidityProof(proof);

    const response = await fetch("/api/greet", {
      method: "POST",
      body: JSON.stringify({
        greeting,
        nullifierHash: publicSignals.nullifierHash,
        solidityProof: solidityProof,
      }),
    });

    if (response.status === 500) {
      const errorMessage = await response.text();
      setLogs(errorMessage);
    } else {
      setLogs("Your anonymous greeting is onchain :)");
    }
  }

  useMemo(() => {
    const provider = new providers.WebSocketProvider("ws://localhost:8545");
    const contract = new Contract(
      "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      Greeter.abi,
      provider
    );
    contract.on("NewGreeting", (data) => {
      setGreeting((oldState) => [...oldState, utils.toUtf8String(data)]);
    });
  }, []);

  return (
    <Flex bg="gray.100" align="center" justify="center" h="100vh">
      <Head>
        <title>Greetings</title>
        <meta
          name="description"
          content="A simple Next.js/Hardhat privacy application with Semaphore."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <VStack>
        <Text fontSize="3xl">Greetings</Text>

        <Text fontSize="xl">
          A simple Next.js/Hardhat privacy application with Semaphore.
        </Text>

        <Text>{logs}</Text>

        <Box bg="white" p={6} rounded="md" w={64}>
          <MyForm />
        </Box>

        <Box bg="white" p={6} rounded="md" w={64}>
          <VStack>
            <Button colorScheme="green" width="full" onClick={() => greet()}>
              Greet
            </Button>
            <Box>Greetings box</Box>
            {greeting.length == 0 ? (
              <Text>No events yet!</Text>
            ) : (
              greeting.map((greeting, index) => (
                <Text key={index}>{greeting}</Text>
              ))
            )}
          </VStack>
        </Box>
      </VStack>
    </Flex>
  );
}
